package repository

import (
	"github.com/anrdart/niatbaik-api/internal/model"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ActivityRepo struct {
	db *gorm.DB
}

func NewActivityRepo(db *gorm.DB) *ActivityRepo {
	return &ActivityRepo{db: db}
}

func (r *ActivityRepo) Create(log *model.ActivityLog) error {
	return r.db.Create(log).Error
}

func (r *ActivityRepo) FindByUser(userID uuid.UUID, limit int) ([]model.ActivityLog, error) {
	var logs []model.ActivityLog
	query := r.db.Where("user_id = ?", userID).Order("created_at desc")
	if limit > 0 {
		query = query.Limit(limit)
	}
	err := query.Find(&logs).Error
	return logs, err
}

func (r *ActivityRepo) FindLoginHistory(userID uuid.UUID, limit int) ([]model.LoginHistory, error) {
	var histories []model.LoginHistory
	query := r.db.Where("user_id = ?", userID).Order("logged_in_at desc")
	if limit > 0 {
		query = query.Limit(limit)
	}
	err := query.Find(&histories).Error
	return histories, err
}

func (r *ActivityRepo) CreateLoginHistory(history *model.LoginHistory) error {
	return r.db.Create(history).Error
}
