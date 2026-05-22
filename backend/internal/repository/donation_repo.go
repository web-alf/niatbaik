package repository

import (
	"github.com/anrdart/niatbaik-api/internal/model"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type DonationRepo struct {
	db *gorm.DB
}

func NewDonationRepo(db *gorm.DB) *DonationRepo {
	return &DonationRepo{db: db}
}

func (r *DonationRepo) Create(donation *model.Donation) error {
	return r.db.Create(donation).Error
}

func (r *DonationRepo) FindByCampaign(campaignID uuid.UUID, limit int) ([]model.Donation, error) {
	var donations []model.Donation
	if err := r.db.Preload("Invoice").
		Joins("JOIN invoices ON invoices.id = donations.invoice_id").
		Where("donations.campaign_id = ? AND invoices.is_paid = ?", campaignID, true).
		Order("donations.created_at desc").Limit(limit).
		Find(&donations).Error; err != nil {
		return nil, err
	}
	return donations, nil
}

func (r *DonationRepo) FindByInvoice(invoiceID uuid.UUID) ([]model.Donation, error) {
	var donations []model.Donation
	if err := r.db.Where("invoice_id = ?", invoiceID).Find(&donations).Error; err != nil {
		return nil, err
	}
	return donations, nil
}
