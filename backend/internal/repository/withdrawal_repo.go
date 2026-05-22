package repository

import (
	"github.com/anrdart/niatbaik-api/internal/model"
	"github.com/anrdart/niatbaik-api/pkg/pagination"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type WithdrawalRepo struct {
	db *gorm.DB
}

func NewWithdrawalRepo(db *gorm.DB) *WithdrawalRepo {
	return &WithdrawalRepo{db: db}
}

func (r *WithdrawalRepo) FindAll(params pagination.PaginationParams, status string) ([]model.Withdrawal, int64, error) {
	var items []model.Withdrawal
	var total int64

	q := r.db.Model(&model.Withdrawal{})
	if status != "" {
		q = q.Where("status = ?", status)
	}

	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	err := pagination.ApplyPagination(q, params).
		Preload("User").
		Preload("Campaign").
		Find(&items).Error
	return items, total, err
}

func (r *WithdrawalRepo) FindByID(id uuid.UUID) (*model.Withdrawal, error) {
	var w model.Withdrawal
	err := r.db.Preload("User").Preload("Campaign").First(&w, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &w, nil
}

func (r *WithdrawalRepo) Update(w *model.Withdrawal) error {
	return r.db.Save(w).Error
}
