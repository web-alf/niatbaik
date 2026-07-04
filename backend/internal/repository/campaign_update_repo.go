package repository

import (
	"github.com/anrdart/niatbaik-api/internal/model"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type CampaignUpdateRepo struct {
	db *gorm.DB
}

func NewCampaignUpdateRepo(db *gorm.DB) *CampaignUpdateRepo {
	return &CampaignUpdateRepo{db: db}
}

// ListByCampaign returns a campaign's info-updates, newest first.
func (r *CampaignUpdateRepo) ListByCampaign(campaignID uuid.UUID) ([]model.CampaignUpdate, error) {
	var updates []model.CampaignUpdate
	err := r.db.Where("campaign_id = ?", campaignID).
		Order("created_at desc").
		Find(&updates).Error
	return updates, err
}

func (r *CampaignUpdateRepo) Create(u *model.CampaignUpdate) error {
	return r.db.Create(u).Error
}

func (r *CampaignUpdateRepo) Delete(id uuid.UUID) error {
	return r.db.Delete(&model.CampaignUpdate{}, "id = ?", id).Error
}
