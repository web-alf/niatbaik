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
	// Omit server-owned columns from the admin save. These are mutated concurrently by
	// the payment path (total_money, the running balance) and the CS rotator
	// (cs_rotator_index), each in its own locked/atomic write. The admin form does a
	// read-modify-write of the WHOLE row with no lock, so a plain Save() would clobber
	// any donation/rotator update that committed during the form round-trip. Save still
	// writes zero-values for every OTHER column, preserving the "clear string / set bool
	// false" semantics the settings service relies on.
	return r.db.Omit("total_money", "cs_rotator_index").Save(setting).Error
}

func (r *SettingRepo) UpdateGoogleAds(fields map[string]any) error {
	return r.db.Model(&model.Setting{}).Where("id = (SELECT id FROM settings ORDER BY created_at LIMIT 1)").Updates(fields).Error
}
