package repository

import (
	"github.com/anrdart/niatbaik-api/internal/model"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type PaymentStatusRepo struct {
	db *gorm.DB
}

func NewPaymentStatusRepo(db *gorm.DB) *PaymentStatusRepo {
	return &PaymentStatusRepo{db: db}
}

func (r *PaymentStatusRepo) FindAll() ([]model.PaymentStatus, error) {
	var rows []model.PaymentStatus
	err := r.db.Order("sort_order asc, created_at asc").Find(&rows).Error
	return rows, err
}

func (r *PaymentStatusRepo) FindByID(id uuid.UUID) (*model.PaymentStatus, error) {
	var s model.PaymentStatus
	if err := r.db.First(&s, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &s, nil
}

func (r *PaymentStatusRepo) FindByCode(code string) (*model.PaymentStatus, error) {
	var s model.PaymentStatus
	if err := r.db.Where("code = ?", code).First(&s).Error; err != nil {
		return nil, err
	}
	return &s, nil
}

// CodeExists reports whether a status with this code exists, optionally excluding an ID.
func (r *PaymentStatusRepo) CodeExists(code string, excludeID *uuid.UUID) bool {
	q := r.db.Model(&model.PaymentStatus{}).Where("code = ?", code)
	if excludeID != nil {
		q = q.Where("id <> ?", *excludeID)
	}
	var count int64
	q.Count(&count)
	return count > 0
}

func (r *PaymentStatusRepo) Create(s *model.PaymentStatus) error {
	return r.db.Create(s).Error
}

func (r *PaymentStatusRepo) Update(s *model.PaymentStatus) error {
	return r.db.Save(s).Error
}

func (r *PaymentStatusRepo) Delete(id uuid.UUID) error {
	return r.db.Delete(&model.PaymentStatus{}, "id = ?", id).Error
}
