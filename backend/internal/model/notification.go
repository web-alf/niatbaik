package model

import (
	"time"

	"github.com/google/uuid"
)

type Notification struct {
	ID        uuid.UUID  `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	UserID    *uuid.UUID `gorm:"type:uuid;index" json:"user_id"` // null = broadcast
	Type      string     `gorm:"size:50;not null" json:"type"`   // donation, campaign, system, fundraiser
	Title     string     `gorm:"size:255;not null" json:"title"`
	Subtitle  string     `gorm:"size:500" json:"subtitle"`
	IsRead    bool       `gorm:"default:false" json:"is_read"`
	Data      *string    `gorm:"type:text" json:"data"` // JSON string, nullable
	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt time.Time  `json:"updated_at"`

	User *User `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE" json:"user,omitempty"`
}
