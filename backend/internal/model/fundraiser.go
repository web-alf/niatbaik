package model

import (
	"time"

	"github.com/google/uuid"
)

type Fundraiser struct {
	ID              uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	UserID          uuid.UUID `gorm:"type:uuid;not null;index" json:"user_id"`
	CampaignID      uuid.UUID `gorm:"type:uuid;not null;index" json:"campaign_id"`
	TotalRaised     int64     `gorm:"default:0" json:"total_raised"`
	TotalClicks     int       `gorm:"default:0" json:"total_clicks"`
	TotalDonors     int       `gorm:"default:0" json:"total_donors"`
	InvoicesCreated int       `gorm:"default:0" json:"invoices_created"`
	InvoicesPaid    int       `gorm:"default:0" json:"invoices_paid"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`

	User     User     `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE" json:"user,omitempty"`
	Campaign Campaign `gorm:"foreignKey:CampaignID;constraint:OnDelete:CASCADE" json:"campaign,omitempty"`
}
