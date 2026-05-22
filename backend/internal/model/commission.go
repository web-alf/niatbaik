package model

import (
	"time"

	"github.com/google/uuid"
)

type Commission struct {
	ID          uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	UserID      uuid.UUID `gorm:"type:uuid;not null;index" json:"user_id"`
	Description string    `gorm:"type:text" json:"description"`
	Amount      int64     `gorm:"not null" json:"amount"`
	EarnedAt    time.Time `gorm:"not null" json:"earned_at"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`

	User User `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE" json:"user,omitempty"`
}
