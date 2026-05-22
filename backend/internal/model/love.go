package model

import (
	"time"

	"github.com/google/uuid"
)

type Love struct {
	ID         uuid.UUID  `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	CampaignID uuid.UUID  `gorm:"type:uuid;not null;uniqueIndex:idx_love_campaign_ip" json:"campaign_id"`
	UserID     *uuid.UUID `gorm:"type:uuid" json:"user_id"`
	IP         string     `gorm:"size:45;not null;uniqueIndex:idx_love_campaign_ip" json:"ip"`
	CreatedAt  time.Time  `json:"created_at"`

	Campaign Campaign `gorm:"foreignKey:CampaignID;constraint:OnDelete:CASCADE" json:"campaign,omitempty"`
	User     *User    `gorm:"foreignKey:UserID;constraint:OnDelete:SET NULL" json:"user,omitempty"`
}
