package model

import (
	"time"

	"github.com/google/uuid"
)

// PaymentStatus is the admin-managed master list of invoice payment statuses
// (e.g. "Menunggu Pembayaran", "Terbayar"). Invoices still store their status as a
// plain string (Code); this table defines the valid set, their display label/color,
// and — crucially — which statuses count as "paid" (IsPaid), so the CS status-change
// flow can trigger payment processing without hardcoded string checks.
type PaymentStatus struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Code      string    `gorm:"size:50;uniqueIndex;not null" json:"code"`  // the value stored on the invoice
	Label     string    `gorm:"size:100;not null" json:"label"`            // display name
	Color     string    `gorm:"size:20" json:"color"`                      // badge color (hex or token)
	IsPaid    bool      `gorm:"default:false" json:"is_paid"`              // true → choosing it credits the campaign
	IsDefault bool      `gorm:"default:false" json:"is_default"`           // initial status for new invoices
	SortOrder int       `gorm:"default:0" json:"sort_order"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
