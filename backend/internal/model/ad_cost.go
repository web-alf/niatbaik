package model

import (
	"time"

	"github.com/google/uuid"
)

type AdCost struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Platform  string    `gorm:"size:50;not null" json:"platform"`
	Amount    int64     `gorm:"not null" json:"amount"`
	Date      time.Time `json:"date"`
	CreatedBy uuid.UUID `gorm:"type:uuid" json:"created_by"`
	CreatedAt time.Time `json:"created_at"`

	Creator User `gorm:"foreignKey:CreatedBy;constraint:OnDelete:SET NULL" json:"creator,omitempty"`
}
