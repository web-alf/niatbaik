package model

import (
	"time"

	"github.com/google/uuid"
)

type Donation struct {
	ID         uuid.UUID  `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	InvoiceID  uuid.UUID  `gorm:"type:uuid;not null;index" json:"invoice_id"`
	CampaignID uuid.UUID  `gorm:"type:uuid;not null;index" json:"campaign_id"`
	UserID     *uuid.UUID `gorm:"type:uuid;index" json:"user_id"`
	DonorName  string     `gorm:"size:255" json:"donor_name"`
	Amount     int64      `gorm:"not null" json:"amount"`
	CreatedAt  time.Time  `json:"created_at"`
	UpdatedAt  time.Time  `json:"updated_at"`

	Invoice  Invoice   `gorm:"foreignKey:InvoiceID;constraint:OnDelete:CASCADE" json:"invoice,omitempty"`
	Campaign Campaign  `gorm:"foreignKey:CampaignID;constraint:OnDelete:CASCADE" json:"campaign,omitempty"`
	User     *User     `gorm:"foreignKey:UserID;constraint:OnDelete:SET NULL" json:"user,omitempty"`
}
