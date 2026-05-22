package model

import (
	"time"

	"github.com/google/uuid"
)

type Withdrawal struct {
	ID           uuid.UUID  `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	UserID       uuid.UUID  `gorm:"type:uuid;not null;index:idx_withdrawal_user_status" json:"user_id"`
	CampaignID   *uuid.UUID `gorm:"type:uuid;index" json:"campaign_id"`
	BankType     string     `gorm:"size:50;not null" json:"bank_type"`
	BankNumber   string     `gorm:"size:50;not null" json:"bank_number"`
	BankName     string     `gorm:"size:100;not null" json:"bank_name"`
	Amount       int64      `gorm:"not null" json:"amount"`
	Evidence     string     `gorm:"size:255" json:"evidence"`
	RequestedAt  *time.Time `json:"requested_at"`
	CompletedAt  *time.Time `json:"completed_at"`
	Status       string     `gorm:"size:50;default:'Dalam Antrian';index:idx_withdrawal_user_status" json:"status"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`

	User     User      `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE" json:"user,omitempty"`
	Campaign *Campaign `gorm:"foreignKey:CampaignID;constraint:OnDelete:SET NULL" json:"campaign,omitempty"`
}
