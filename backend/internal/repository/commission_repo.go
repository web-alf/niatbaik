package repository

import (
	"github.com/anrdart/niatbaik-api/internal/model"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type CommissionRepo struct {
	db *gorm.DB
}

func NewCommissionRepo(db *gorm.DB) *CommissionRepo {
	return &CommissionRepo{db: db}
}

func (r *CommissionRepo) FindByUser(userID uuid.UUID) ([]model.Commission, error) {
	var commissions []model.Commission
	err := r.db.Where("user_id = ?", userID).
		Order("earned_at desc").
		Find(&commissions).Error
	return commissions, err
}

func (r *CommissionRepo) Create(c *model.Commission) error {
	return r.db.Create(c).Error
}

func (r *CommissionRepo) SumByUser(userID uuid.UUID) (int64, error) {
	var total int64
	err := r.db.Model(&model.Commission{}).
		Where("user_id = ?", userID).
		Select("COALESCE(SUM(amount), 0)").
		Scan(&total).Error
	return total, err
}
