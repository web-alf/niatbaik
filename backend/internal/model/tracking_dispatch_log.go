package model

import (
	"time"

	"github.com/google/uuid"
)

// TrackingDispatchLog records one server-side conversion dispatch attempt to an ad
// platform (Meta CAPI or TikTok EAPI). It is the source of truth for the "last event
// result" shown on the Advertiser dashboard's pixel-status panel: success/HTTP/error
// per platform, replacing the hardcoded mock badges.
type TrackingDispatchLog struct {
	ID            uuid.UUID  `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Platform      string     `gorm:"size:20;not null;index" json:"platform"`       // "meta" | "tiktok" | "google" (GA4 MP)
	EventName     string     `gorm:"size:50;not null" json:"event_name"`           // "Purchase" (Meta) / "CompletePayment" (TikTok)
	InvoiceID     *uuid.UUID `gorm:"type:uuid;index" json:"invoice_id,omitempty"`  // nullable for test events
	EventID       string     `gorm:"size:100" json:"event_id"`                     // deterministic = invoice_number, platform dedup
	Success       bool       `gorm:"not null" json:"success"`
	HTTPStatus    int        `json:"http_status"`
	RemoteEventID string     `gorm:"size:200" json:"remote_event_id,omitempty"`    // id returned by the platform
	ErrorMessage  string     `gorm:"type:text" json:"error_message,omitempty"`
	CreatedAt     time.Time  `gorm:"index" json:"created_at"`
}
