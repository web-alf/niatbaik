package repository

import (
	"github.com/anrdart/niatbaik-api/internal/model"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type VerificationRepo struct {
	db *gorm.DB
}

func NewVerificationRepo(db *gorm.DB) *VerificationRepo {
	return &VerificationRepo{db: db}
}

func (r *VerificationRepo) FindPending() ([]model.User, error) {
	var users []model.User
	err := r.db.Preload("VerificationDetail").
		Where("verification_status != ?", "verified").
		Where("verification_status != ?", "unverified").
		Order("created_at desc").
		Find(&users).Error
	return users, err
}

func (r *VerificationRepo) FindByUserID(userID uuid.UUID) (*model.VerificationDetail, error) {
	var v model.VerificationDetail
	err := r.db.Preload("User").Where("user_id = ?", userID).First(&v).Error
	if err != nil {
		return nil, err
	}
	return &v, nil
}

func (r *VerificationRepo) Update(v *model.VerificationDetail) error {
	return r.db.Save(v).Error
}
