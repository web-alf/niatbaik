package repository

import (
	"github.com/anrdart/niatbaik-api/internal/model"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
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

// FindByCampaign fetches one update scoped to its campaign so an admin cannot edit an
// update through a different campaign's URL.
func (r *CampaignUpdateRepo) FindByCampaign(campaignID, id uuid.UUID) (*model.CampaignUpdate, error) {
	var u model.CampaignUpdate
	if err := r.db.Where("campaign_id = ? AND id = ?", campaignID, id).First(&u).Error; err != nil {
		return nil, err
	}
	return &u, nil
}

// Update persists edited columns only; associations (Campaign/User) are never
// written back from the zero-valued structs on the model.
func (r *CampaignUpdateRepo) Update(u *model.CampaignUpdate) error {
	return r.db.Omit(clause.Associations).Save(u).Error
}

func (r *CampaignUpdateRepo) Delete(id uuid.UUID) error {
	return r.db.Delete(&model.CampaignUpdate{}, "id = ?", id).Error
}
