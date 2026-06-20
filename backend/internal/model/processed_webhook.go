package model

import (
	"time"

	"github.com/google/uuid"
)

// ProcessedWebhook records the unique id of an inbound gateway webhook mutation that
// has already been handled, so a replayed or duplicated delivery can be short-circuited
// before it touches any balance. Moota signs only the body (no nonce/timestamp), so a
// captured-and-replayed valid payload would otherwise re-enter reconciliation; for the
// amount-only fallback that could settle a DIFFERENT unpaid invoice for free. The
// (provider, external_id) pair is the idempotency key.
type ProcessedWebhook struct {
	ID         uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Provider   string    `gorm:"size:20;not null;uniqueIndex:idx_provider_external" json:"provider"`     // "moota" | "flip"
	ExternalID string    `gorm:"size:255;not null;uniqueIndex:idx_provider_external" json:"external_id"` // mutation id / event id
	InvoiceNumber string `gorm:"size:50" json:"invoice_number"`
	CreatedAt  time.Time `json:"created_at"`
}
