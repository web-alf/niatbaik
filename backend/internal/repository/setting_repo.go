package repository

import (
	"github.com/anrdart/niatbaik-api/internal/model"
	"gorm.io/gorm"
)

type SettingRepo struct {
	db *gorm.DB
}

func NewSettingRepo(db *gorm.DB) *SettingRepo {
	return &SettingRepo{db: db}
}

func (r *SettingRepo) Get() (*model.Setting, error) {
	var setting model.Setting
	if err := r.db.First(&setting).Error; err != nil {
		return nil, err
	}
	return &setting, nil
}

func (r *SettingRepo) Update(setting *model.Setting) error {
	return r.db.Save(setting).Error
}
