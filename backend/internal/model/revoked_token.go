package model

import "time"

// RevokedToken is a denylist entry for a JWT that must no longer be accepted
// (e.g. after logout). Keyed by the token's JTI claim. Rows can be purged once
// ExpiresAt has passed, since an expired token is rejected by signature/exp anyway.
type RevokedToken struct {
	ID        string    `gorm:"primaryKey;size:64" json:"id"` // JWT ID (jti)
	ExpiresAt time.Time `gorm:"index" json:"expires_at"`
	CreatedAt time.Time `json:"created_at"`
}
