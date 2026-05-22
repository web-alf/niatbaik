package model

import (
	"time"

	"github.com/google/uuid"
)

type CampaignFund struct {
	ID          uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	CampaignID  uuid.UUID `gorm:"type:uuid;not null;index" json:"campaign_id"`
	AmountIn    int64     `gorm:"default:0" json:"amount_in"`
	AmountOut   int64     `gorm:"default:0" json:"amount_out"`
	Description string    `gorm:"type:text" json:"description"`
	Month       int       `json:"month"`
	Year        int       `json:"year"`
	Balance     int64     `gorm:"default:0" json:"balance"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`

	Campaign Campaign `gorm:"foreignKey:CampaignID;constraint:OnDelete:CASCADE" json:"campaign,omitempty"`
}
