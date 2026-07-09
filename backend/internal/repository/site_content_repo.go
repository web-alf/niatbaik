package repository

import (
	"github.com/anrdart/niatbaik-api/internal/model"
	"gorm.io/gorm"
)

type SiteContentRepo struct {
	db *gorm.DB
}

func NewSiteContentRepo(db *gorm.DB) *SiteContentRepo {
	return &SiteContentRepo{db: db}
}

// GetAll returns every content row. Used by the admin editor and the public endpoint.
func (r *SiteContentRepo) GetAll() ([]model.SiteContent, error) {
	var rows []model.SiteContent
	err := r.db.Order("key asc").Find(&rows).Error
	return rows, err
}

// Get returns one section by key. Returns gorm.ErrRecordNotFound when absent.
func (r *SiteContentRepo) Get(key string) (*model.SiteContent, error) {
	var row model.SiteContent
	err := r.db.Where("key = ?", key).First(&row).Error
	if err != nil {
		return nil, err
	}
	return &row, nil
}

// Upsert creates the row when absent, otherwise overwrites Value. Idempotent.
func (r *SiteContentRepo) Upsert(key, value string) error {
	var row model.SiteContent
	err := r.db.Where("key = ?", key).First(&row).Error
	if err == gorm.ErrRecordNotFound {
		return r.db.Create(&model.SiteContent{Key: key, Value: value}).Error
	}
	if err != nil {
		return err
	}
	row.Value = value
	return r.db.Save(&row).Error
}
