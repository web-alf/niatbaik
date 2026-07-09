package model

import (
	"time"

	"github.com/google/uuid"
)

// SiteContent is the admin-editable homepage CMS store: one row per section
// (navbar, hero, how_to, faq, footer, …) holding its content as a JSON blob.
// Mirrors the singleton Setting pattern but is key→JSON so each homepage section
// owns its own shape without a schema migration when a field is added.
type SiteContent struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	// Key is a stable section identifier from the server-side allowlist (validated in the
	// service). Unique so Upsert is a find-or-create.
	Key       string    `gorm:"size:50;uniqueIndex;not null" json:"key"`
	// Value is the section's JSON content (stored raw; the service marshals/validates it).
	Value     string    `gorm:"type:text" json:"value"`
	UpdatedAt time.Time `json:"updated_at"`
}
