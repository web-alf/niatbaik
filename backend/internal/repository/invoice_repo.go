package repository

import (
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

func (r *InvoiceRepo) FindAll(params request.PaginationParams) ([]model.Invoice, int64, error) {
	var invoices []model.Invoice
	var total int64

	q := r.db.Model(&model.Invoice{}).Preload("Campaign").Preload("PaymentMethod").Preload("User")

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
