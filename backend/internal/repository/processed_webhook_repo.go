package repository

import (
	"errors"
	"strings"

	"github.com/anrdart/niatbaik-api/internal/model"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type ProcessedWebhookRepo struct {
	db *gorm.DB
}

func NewProcessedWebhookRepo(db *gorm.DB) *ProcessedWebhookRepo {
	return &ProcessedWebhookRepo{db: db}
}

// MarkProcessed records (provider, externalID) as handled and reports whether THIS call
// was the one that inserted it. A unique index on (provider, external_id) makes the
// insert the atomic dedup point: the first delivery returns (true, nil) and proceeds;
// a replay collides on the index and returns (false, nil) so the caller skips it. An
// empty externalID returns (true, nil) — nothing to dedup on, fall through to normal
// idempotency (the per-invoice IsPaid guard).
func (r *ProcessedWebhookRepo) MarkProcessed(provider, externalID, invoiceNumber string) (bool, error) {
	if strings.TrimSpace(externalID) == "" {
		return true, nil
	}
	row := model.ProcessedWebhook{
		Provider:      provider,
		ExternalID:    externalID,
		InvoiceNumber: invoiceNumber,
	}
	// ON CONFLICT DO NOTHING: a duplicate (provider, external_id) inserts zero rows.
	res := r.db.Clauses(clause.OnConflict{DoNothing: true}).Create(&row)
	if res.Error != nil {
		// Treat a duplicate-key error as "already processed" rather than a hard failure,
		// in case the dialect surfaces the conflict as an error instead of 0 rows.
		if isDuplicateErr(res.Error) {
			return false, nil
		}
		return false, res.Error
	}
	return res.RowsAffected > 0, nil
}

// AlreadyProcessed reports whether (provider, externalID) has been recorded as handled.
// Read-only pre-check used before settlement so a replay of an already-settled mutation
// is skipped, while a mutation whose settlement previously errored (never recorded) is
// allowed through again on Moota's retry.
func (r *ProcessedWebhookRepo) AlreadyProcessed(provider, externalID string) (bool, error) {
	if strings.TrimSpace(externalID) == "" {
		return false, nil
	}
	var count int64
	err := r.db.Model(&model.ProcessedWebhook{}).
		Where("provider = ? AND external_id = ?", provider, externalID).
		Count(&count).Error
	return count > 0, err
}

func isDuplicateErr(err error) bool {
	if err == nil {
		return false
	}
	if errors.Is(err, gorm.ErrDuplicatedKey) {
		return true
	}
	msg := strings.ToLower(err.Error())
	return strings.Contains(msg, "duplicate") || strings.Contains(msg, "unique") || strings.Contains(msg, "23505")
}
