package repository

import (
	"github.com/anrdart/niatbaik-api/internal/model"
	"github.com/anrdart/niatbaik-api/pkg/pagination"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type FundraiserRepo struct {
	db *gorm.DB
}

func NewFundraiserRepo(db *gorm.DB) *FundraiserRepo {
	return &FundraiserRepo{db: db}
}

func (r *FundraiserRepo) FindAll(params pagination.PaginationParams) ([]model.Fundraiser, int64, error) {
	var fundraisers []model.Fundraiser
	var total int64

	query := r.db.Model(&model.Fundraiser{})
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	err := pagination.ApplyPagination(query, params).
		Preload("User").
		Preload("Campaign").
		Find(&fundraisers).Error
	return fundraisers, total, err
}

func (r *FundraiserRepo) FindByID(id uuid.UUID) (*model.Fundraiser, error) {
	var fundraiser model.Fundraiser
	err := r.db.Preload("User").Preload("Campaign").
		First(&fundraiser, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &fundraiser, nil
}

// FindByUser returns all of a user's affiliate records (one per campaign they fundraise
// for), newest first, with the campaign preloaded for the portal's referral links.
func (r *FundraiserRepo) FindByUser(userID uuid.UUID) ([]model.Fundraiser, error) {
	var fundraisers []model.Fundraiser
	err := r.db.Preload("Campaign").
		Where("user_id = ?", userID).
		Order("created_at desc").
		Find(&fundraisers).Error
	return fundraisers, err
}

func (r *FundraiserRepo) FindByUserAndCampaign(userID, campaignID uuid.UUID) (*model.Fundraiser, error) {
	var fundraiser model.Fundraiser
	err := r.db.Where("user_id = ? AND campaign_id = ?", userID, campaignID).
		First(&fundraiser).Error
	if err != nil {
		return nil, err
	}
	return &fundraiser, nil
}

func (r *FundraiserRepo) Create(f *model.Fundraiser) error {
	return r.db.Create(f).Error
}

func (r *FundraiserRepo) Update(f *model.Fundraiser) error {
	return r.db.Save(f).Error
}
