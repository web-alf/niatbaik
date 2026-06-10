package repository

import (
	"time"

	"github.com/anrdart/niatbaik-api/internal/model"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type RevokedTokenRepo struct {
	db *gorm.DB
}

func NewRevokedTokenRepo(db *gorm.DB) *RevokedTokenRepo {
	return &RevokedTokenRepo{db: db}
}

// Revoke adds a token's JTI to the denylist until its natural expiry. Idempotent:
// re-revoking the same JTI is a no-op.
func (r *RevokedTokenRepo) Revoke(jti string, expiresAt time.Time) error {
	return r.db.Clauses(clause.OnConflict{DoNothing: true}).
		Create(&model.RevokedToken{ID: jti, ExpiresAt: expiresAt}).Error
}

// IsRevoked reports whether a JTI is on the denylist (and not yet purged).
func (r *RevokedTokenRepo) IsRevoked(jti string) (bool, error) {
	var count int64
	if err := r.db.Model(&model.RevokedToken{}).
		Where("id = ?", jti).Count(&count).Error; err != nil {
		return false, err
	}
	return count > 0, nil
}

// PurgeExpired removes denylist rows whose tokens have already expired.
func (r *RevokedTokenRepo) PurgeExpired() error {
	return r.db.Where("expires_at < ?", time.Now()).Delete(&model.RevokedToken{}).Error
}
