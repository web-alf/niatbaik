package model

import (
	"time"

	"github.com/google/uuid"
)

type CampaignUpdate struct {
	ID         uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	CampaignID uuid.UUID `gorm:"type:uuid;not null;index" json:"campaign_id"`
	UserID     uuid.UUID `gorm:"type:uuid;not null;index" json:"user_id"`
	Title      string    `gorm:"size:255;not null" json:"title"`
	Image      string    `gorm:"size:255" json:"image"`
	Body       string    `gorm:"type:text" json:"body"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`

	Campaign Campaign `gorm:"foreignKey:CampaignID;constraint:OnDelete:CASCADE" json:"campaign,omitempty"`
	User     User     `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE" json:"user,omitempty"`
}
