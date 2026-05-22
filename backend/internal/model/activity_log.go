package model

import (
	"time"

	"github.com/google/uuid"
)

type ActivityLog struct {
	ID          uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	UserID      uuid.UUID `gorm:"type:uuid;not null;index" json:"user_id"`
	Action      string    `gorm:"size:50;not null" json:"action"` // create, update, delete, export, login, settings
	Description string    `gorm:"type:text" json:"description"`
	IP          string    `gorm:"size:45" json:"ip"`
	UserAgent   string    `gorm:"size:500" json:"user_agent"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`

	User User `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE" json:"user,omitempty"`
}
