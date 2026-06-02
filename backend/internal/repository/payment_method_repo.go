package repository

import (
	"errors"

	"github.com/anrdart/niatbaik-api/internal/model"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type PaymentMethodRepo struct {
	db *gorm.DB
}

func NewPaymentMethodRepo(db *gorm.DB) *PaymentMethodRepo {
	return &PaymentMethodRepo{db: db}
}

func (r *PaymentMethodRepo) FindAll() ([]model.PaymentMethod, error) {
	var list []model.PaymentMethod
	err := r.db.Order("is_default desc").Order("created_at asc").Find(&list).Error
	return list, err
}

func (r *PaymentMethodRepo) FindByID(id uuid.UUID) (*model.PaymentMethod, error) {
	var pm model.PaymentMethod
	if err := r.db.First(&pm, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &pm, nil
}

func (r *PaymentMethodRepo) Create(pm *model.PaymentMethod) error {
	return r.db.Create(pm).Error
}

func (r *PaymentMethodRepo) Update(pm *model.PaymentMethod) error {
	return r.db.Save(pm).Error
}

func (r *PaymentMethodRepo) Delete(id uuid.UUID) error {
	pm, err := r.FindByID(id)
	if err != nil {
		return err
	}
	if pm.IsDefault {
		return errors.New("metode pembayaran bawaan tidak dapat dihapus")
	}
	return r.db.Delete(&model.PaymentMethod{}, "id = ?", id).Error
}
