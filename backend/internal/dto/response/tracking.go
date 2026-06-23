package response

import "time"

// TrackingLastEvent is the most recent dispatch attempt for a platform.
type TrackingLastEvent struct {
	At         time.Time `json:"at"`
	Success    bool      `json:"success"`
	HTTPStatus int       `json:"http_status"`
	Error      string    `json:"error,omitempty"`
	EventName  string    `json:"event_name,omitempty"`
}

// TrackingPlatformStatus is one platform's pixel/connection status. The Status field
// drives the dashboard badge per the 4-state rule (active/configured/error/not_connected).
type TrackingPlatformStatus struct {
	Platform       string             `json:"platform"` // "meta" | "google" | "tiktok"
	Name           string             `json:"name"`     // display label
	Configured     bool               `json:"configured"`
	Enabled        bool               `json:"enabled"` // server-side gate flag on
	Status         string             `json:"status"`  // active|configured|error|not_connected
	LastEvent      *TrackingLastEvent `json:"last_event,omitempty"`
	RecentCount24h int64              `json:"recent_count_24h"`
}

// TrackingStatusResponse is the payload of GET /admin/tracking/status.
type TrackingStatusResponse struct {
	Platforms []TrackingPlatformStatus `json:"platforms"`
}
