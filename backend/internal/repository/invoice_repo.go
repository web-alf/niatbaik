package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/anrdart/niatbaik-api/internal/dto/request"
	"github.com/anrdart/niatbaik-api/internal/model"
	"github.com/anrdart/niatbaik-api/pkg/pagination"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type InvoiceRepo struct {
	db *gorm.DB
}

func NewInvoiceRepo(db *gorm.DB) *InvoiceRepo {
	return &InvoiceRepo{db: db}
}

func (r *InvoiceRepo) Create(invoice *model.Invoice) error {
	return r.db.Create(invoice).Error
}

func (r *InvoiceRepo) FindByInvoiceNumber(number string) (*model.Invoice, error) {
	var invoice model.Invoice
	if err := r.db.Preload("Campaign").Preload("PaymentMethod").Preload("User").
		Where("invoice_number = ?", number).First(&invoice).Error; err != nil {
		return nil, err
	}
	return &invoice, nil
}

// FindUnpaidByInvoiceNumber looks up an invoice by its exact invoice number for webhook
// settlement. The expired_at filter is intentionally ABSENT here: a gateway/bank webhook
// is the authoritative signal that the donor paid, so a payment landing moments after
// the local 24h expiry clock must still be credited. Dropping the filter only widens the
// match for an EXACT invoice number, so it cannot misattribute to a different donor.
// (Previously the `expired_at >= now` clause silently dropped late payments = lost money.)
func (r *InvoiceRepo) FindUnpaidByInvoiceNumber(number string) (*model.Invoice, error) {
	var invoice model.Invoice
	if err := r.db.Preload("Campaign").Preload("Referrer").
		Clauses(clause.Locking{Strength: "UPDATE"}).
		Where("invoice_number = ? AND is_paid = ?", number, false).
		First(&invoice).Error; err != nil {
		return nil, err
	}
	return &invoice, nil
}

// FindUnpaidByAmountForUpdate reconciles a transfer with no invoice tag by matching its
// exact total. Because this is a FUZZY match (amount only), it keeps a 7-day grace window
// past expired_at so a slightly-late manual transfer still reconciles, while a transfer
// can't latch onto a months-old stale invoice. (Previously `expired_at >= now` rejected
// every payment that arrived after the 24h mark = lost money.)
func (r *InvoiceRepo) FindUnpaidByAmountForUpdate(amount int64) (*model.Invoice, error) {
	var invoice model.Invoice
	grace := time.Now().Add(-7 * 24 * time.Hour)
	if err := r.db.Preload("Campaign").Preload("Referrer").
		Clauses(clause.Locking{Strength: "UPDATE"}).
		Where("total = ? AND is_paid = ? AND expired_at >= ?", amount, false, grace).
		Order("created_at asc").First(&invoice).Error; err != nil {
		return nil, err
	}
	return &invoice, nil
}

// CountUnpaidByAmount counts how many unpaid, in-grace invoices share an exact total.
// The amount-only Moota fallback must REFUSE to auto-settle when this is > 1: with two
// same-total invoices (e.g. two donors who both gave Rp100.000) the finder would credit
// the OLDEST one — the wrong donor's invoice. The caller queues the ambiguous transfer
// for manual review instead of silently misattributing it.
func (r *InvoiceRepo) CountUnpaidByAmount(amount int64) (int64, error) {
	var count int64
	grace := time.Now().Add(-7 * 24 * time.Hour)
	err := r.db.Model(&model.Invoice{}).
		Where("total = ? AND is_paid = ? AND expired_at >= ?", amount, false, grace).
		Count(&count).Error
	return count, err
}

func (r *InvoiceRepo) FindAll(params request.PaginationParams) ([]model.Invoice, int64, error) {
	var invoices []model.Invoice
	var total int64

	// Referrer feeds the fundraiser column in admin list/export.
	q := r.db.Model(&model.Invoice{}).Preload("Campaign").Preload("PaymentMethod").Preload("User").Preload("Referrer")

	if params.Status != "" {
		q = q.Where("status = ?", params.Status)
	}
	if params.Search != "" {
		q = q.Where("invoice_number ILIKE ? OR donor_name ILIKE ?", "%"+params.Search+"%", "%"+params.Search+"%")
	}

	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (params.Page - 1) * params.Limit
	if err := q.Order(pagination.SanitizeSort(params.Sort)).Offset(offset).Limit(params.Limit).Find(&invoices).Error; err != nil {
		return nil, 0, err
	}

	return invoices, total, nil
}

func (r *InvoiceRepo) Update(invoice *model.Invoice) error {
	return r.db.Save(invoice).Error
}

type GoogleAdsSnapshot struct {
	CustomerID, LoginCustomerID, ConversionActionID string
	Enabled                                         bool
}

func affected(res *gorm.DB, action string) error {
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected != 1 {
		return fmt.Errorf("%s: transition lost", action)
	}
	return nil
}

func (r *InvoiceRepo) ClaimGoogleAdsDue(ctx context.Context, now time.Time) (*model.Invoice, error) {
	var inv model.Invoice
	err := r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		stale := now.Add(-10 * time.Minute)
		err := tx.Clauses(clause.Locking{Strength: "UPDATE", Options: "SKIP LOCKED"}).
			Where("is_paid = ? AND ((google_ads_server_status IN ? AND (google_ads_server_next_attempt_at IS NULL OR google_ads_server_next_attempt_at <= ?)) OR (google_ads_server_status = ? AND google_ads_server_processing_at <= ?))", true, []string{model.GoogleAdsConversionPendingUpload, model.GoogleAdsConversionRetryable}, now, model.GoogleAdsConversionProcessing, stale).
			Order("COALESCE(google_ads_server_next_attempt_at, created_at) ASC").First(&inv).Error
		if err != nil {
			return err
		}
		return affected(tx.Model(&model.Invoice{}).Where("id = ? AND google_ads_server_status = ?", inv.ID, inv.GoogleAdsServerStatus).Updates(map[string]any{"google_ads_server_status": model.GoogleAdsConversionProcessing, "google_ads_server_processing_at": now}), "claim")
	})
	if err != nil {
		return nil, err
	}
	inv.GoogleAdsServerStatus, inv.GoogleAdsServerProcessingAt = model.GoogleAdsConversionProcessing, &now
	return &inv, nil
}

func (r *InvoiceRepo) StartGoogleAdsSubmission(ctx context.Context, id uuid.UUID, now time.Time) error {
	return affected(r.db.WithContext(ctx).Model(&model.Invoice{}).Where("id = ? AND google_ads_server_status = ? AND google_ads_server_request_id = ''", id, model.GoogleAdsConversionProcessing).Updates(map[string]any{"google_ads_server_attempt_count": gorm.Expr("google_ads_server_attempt_count + 1"), "google_ads_server_attempted_at": now}), "start submission")
}
func (r *InvoiceRepo) PersistGoogleAdsRequestID(ctx context.Context, id uuid.UUID, requestID string, now time.Time) error {
	return affected(r.db.WithContext(ctx).Model(&model.Invoice{}).Where("id = ? AND google_ads_server_status = ? AND google_ads_server_request_id = ''", id, model.GoogleAdsConversionProcessing).Updates(map[string]any{"google_ads_server_request_id": requestID, "google_ads_server_next_attempt_at": now}), "persist request")
}
func (r *InvoiceRepo) MarkGoogleAdsSent(ctx context.Context, id uuid.UUID, now time.Time) error {
	return affected(r.db.WithContext(ctx).Model(&model.Invoice{}).Where("id = ? AND google_ads_server_status = ?", id, model.GoogleAdsConversionProcessing).Updates(map[string]any{"google_ads_server_status": model.GoogleAdsConversionServerSent, "google_ads_server_sent_at": now, "google_ads_server_error": "", "google_ads_server_next_attempt_at": nil, "google_ads_server_processing_at": nil}), "mark sent")
}
func (r *InvoiceRepo) MarkGoogleAdsRetryable(ctx context.Context, id uuid.UUID, summary string, due time.Time) error {
	return affected(r.db.WithContext(ctx).Model(&model.Invoice{}).Where("id = ? AND google_ads_server_status = ?", id, model.GoogleAdsConversionProcessing).Updates(map[string]any{"google_ads_server_status": model.GoogleAdsConversionRetryable, "google_ads_server_error": summary, "google_ads_server_next_attempt_at": due, "google_ads_server_processing_at": nil}), "mark retryable")
}
func (r *InvoiceRepo) MarkGoogleAdsFailed(ctx context.Context, id uuid.UUID, summary string) error {
	return affected(r.db.WithContext(ctx).Model(&model.Invoice{}).Where("id = ? AND google_ads_server_status = ?", id, model.GoogleAdsConversionProcessing).Updates(map[string]any{"google_ads_server_status": model.GoogleAdsConversionFailed, "google_ads_server_error": summary, "google_ads_server_next_attempt_at": nil, "google_ads_server_processing_at": nil}), "mark failed")
}
func (r *InvoiceRepo) ReleaseGoogleAdsClaim(ctx context.Context, id uuid.UUID, due time.Time) error {
	return affected(r.db.WithContext(ctx).Model(&model.Invoice{}).Where("id = ? AND google_ads_server_status = ?", id, model.GoogleAdsConversionProcessing).Updates(map[string]any{"google_ads_server_status": model.GoogleAdsConversionRetryable, "google_ads_server_next_attempt_at": due, "google_ads_server_processing_at": nil}), "release claim")
}
func (r *InvoiceRepo) RetryGoogleAdsInvoice(ctx context.Context, id uuid.UUID, snap GoogleAdsSnapshot, now time.Time) error {
	return affected(r.db.WithContext(ctx).Model(&model.Invoice{}).Where("id = ? AND is_paid = ? AND google_ads_server_status <> ? AND (gclid <> '' OR gbraid <> '' OR wbraid <> '')", id, true, model.GoogleAdsConversionServerSent).Updates(map[string]any{"google_ads_customer_id_snapshot": snap.CustomerID, "google_ads_login_customer_id_snapshot": snap.LoginCustomerID, "google_ads_conversion_action_id_snapshot": snap.ConversionActionID, "google_ads_server_upload_enabled_snapshot": snap.Enabled, "google_ads_server_status": model.GoogleAdsConversionPendingUpload, "google_ads_server_request_id": "", "google_ads_server_error": "", "google_ads_server_attempt_count": 0, "google_ads_server_attempted_at": nil, "google_ads_server_sent_at": nil, "google_ads_server_next_attempt_at": now, "google_ads_server_processing_at": nil}), "retry invoice")
}

// ExpireStale flips unpaid invoices whose ExpiredAt has passed to the "Kadaluarsa"
// status in one bulk UPDATE. Only touches still-pending, not-yet-expired-labeled
// rows so it is idempotent and never disturbs paid invoices. Returns rows affected.
func (r *InvoiceRepo) ExpireStale() (int64, error) {
	res := r.db.Model(&model.Invoice{}).
		Where("is_paid = ? AND status <> ? AND expired_at < ?", false, "Kadaluarsa", time.Now()).
		Update("status", "Kadaluarsa")
	return res.RowsAffected, res.Error
}

func (r *InvoiceRepo) CountDonors(campaignID uuid.UUID) (int64, error) {
	var count int64
	if err := r.db.Model(&model.Invoice{}).
		Where("campaign_id = ? AND is_paid = ?", campaignID, true).
		Count(&count).Error; err != nil {
		return 0, err
	}
	return count, nil
}

func (r *InvoiceRepo) CountAllPaidDonors() (int64, error) {
	var count int64
	if err := r.db.Model(&model.Invoice{}).
		Where("is_paid = ?", true).
		Count(&count).Error; err != nil {
		return 0, err
	}
	return count, nil
}
