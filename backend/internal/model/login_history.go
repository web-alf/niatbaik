package model

import (
	"time"

	"github.com/google/uuid"
)

type LoginHistory struct {
	ID         uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	UserID     uuid.UUID `gorm:"type:uuid;not null;index" json:"user_id"`
	IP         string    `gorm:"size:45" json:"ip"`
	Location   string    `gorm:"size:255" json:"location"`
	Device     string    `gorm:"size:255" json:"device"`
	LoggedInAt time.Time `gorm:"not null" json:"logged_in_at"`
	IsCurrent  bool      `gorm:"default:false" json:"is_current"`

	User User `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE" json:"user,omitempty"`
}
