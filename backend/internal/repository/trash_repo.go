package repository

import (
	"github.com/anrdart/niatbaik-api/internal/model"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type TrashRepo struct {
	db *gorm.DB
}

func NewTrashRepo(db *gorm.DB) *TrashRepo {
	return &TrashRepo{db: db}
}

func (r *TrashRepo) FindDeletedCampaigns() ([]model.Campaign, error) {
	var campaigns []model.Campaign
	err := r.db.Unscoped().
		Where("deleted_at IS NOT NULL").
		Preload("User").
		Order("deleted_at desc").
		Find(&campaigns).Error
	return campaigns, err
}

func (r *TrashRepo) FindDeletedUsers() ([]model.User, error) {
	var users []model.User
	err := r.db.Unscoped().
		Where("deleted_at IS NOT NULL").
		Order("deleted_at desc").
		Find(&users).Error
	return users, err
}

func (r *TrashRepo) RestoreCampaign(id uuid.UUID) error {
	return r.db.Unscoped().
		Model(&model.Campaign{}).
		Where("id = ?", id).
		Update("deleted_at", nil).Error
}

func (r *TrashRepo) RestoreUser(id uuid.UUID) error {
	return r.db.Unscoped().
		Model(&model.User{}).
		Where("id = ?", id).
		Update("deleted_at", nil).Error
}

func (r *TrashRepo) PermanentDeleteCampaign(id uuid.UUID) error {
	return r.db.Unscoped().Delete(&model.Campaign{}, "id = ?", id).Error
}

func (r *TrashRepo) PermanentDeleteUser(id uuid.UUID) error {
	return r.db.Unscoped().Delete(&model.User{}, "id = ?", id).Error
}
