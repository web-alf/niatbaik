package model

import (
	"time"

	"github.com/google/uuid"
)

type VerificationDetail struct {
	ID         uuid.UUID  `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	UserID     uuid.UUID  `gorm:"type:uuid;not null;uniqueIndex" json:"user_id"`
	KtpImage   string     `gorm:"size:255" json:"ktp_image"`
	KtpSelfie  string     `gorm:"size:255" json:"ktp_selfie"`
	Status     string     `gorm:"size:20;default:'pending'" json:"status"` // pending, approved, rejected
	ReviewedAt *time.Time `json:"reviewed_at"`
	CreatedAt  time.Time  `json:"created_at"`
	UpdatedAt  time.Time  `json:"updated_at"`

	User User `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE" json:"user,omitempty"`
}
