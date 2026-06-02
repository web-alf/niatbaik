package model

import (
	"time"

	"github.com/google/uuid"
)

type PaymentMethod struct {
	ID         uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	BankName   string    `gorm:"size:100;not null" json:"bank_name"`
	BankNumber string    `gorm:"size:50" json:"bank_number"`
	BankType   string    `gorm:"size:50" json:"bank_type"`
	Image      string    `gorm:"size:255" json:"image"`
	Type          string    `gorm:"size:50" json:"type"`     // va, ewallet, qris
	Code          string    `gorm:"size:50" json:"code"`     // gateway-specific code
	AdminFee      int       `gorm:"default:0" json:"admin_fee"`
	Category      string    `gorm:"size:50" json:"category"` // bank_transfer, ewallet, qris
	Active        bool      `gorm:"default:true" json:"active"`
	AccountName   string    `gorm:"size:150" json:"account_name"`
	GatewayConfig string    `gorm:"type:text" json:"gateway_config"` // JSON: moota/flip settings
	IsDefault     bool      `gorm:"default:false" json:"is_default"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}
