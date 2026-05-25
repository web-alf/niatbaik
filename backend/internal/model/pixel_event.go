package model

import (
	"time"

	"github.com/google/uuid"
)

type PixelEvent struct {
	ID         uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	CampaignID uuid.UUID `gorm:"type:uuid;not null;index" json:"campaign_id"`
	PixelType  string    `gorm:"size:50" json:"pixel_type"`
	EventName  string    `gorm:"size:100" json:"event_name"`
	Count      int64     `gorm:"default:0" json:"count"`
	Date       time.Time `json:"date"`

	Campaign Campaign `gorm:"foreignKey:CampaignID;constraint:OnDelete:CASCADE" json:"campaign,omitempty"`
}
