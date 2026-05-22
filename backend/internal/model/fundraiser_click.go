package model

import (
	"time"

	"github.com/google/uuid"
)

type FundraiserClick struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	IP        string    `gorm:"size:45;not null" json:"ip"`
	ClickedAt time.Time `gorm:"not null" json:"clicked_at"`
	UserID    uuid.UUID `gorm:"type:uuid;not null;index" json:"user_id"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	User User `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE" json:"user,omitempty"`
}
