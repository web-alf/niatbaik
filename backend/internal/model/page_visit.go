package model

import (
	"time"

	"github.com/google/uuid"
)

// PageVisit is a daily counter of public landing/campaign page views, bucketed by
// (campaign, utm_source, date) so the row count stays bounded. CampaignID is nil for a
// site-wide (non-campaign) landing hit. Written by the public /track/visit beacon and
// read by the analytics traffic breakdown — the first REAL visit signal (previously
// "visits" was proxied off paid invoices, so it read 0 without UTM'd paid donations).
type PageVisit struct {
	ID         uuid.UUID  `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	CampaignID *uuid.UUID `gorm:"type:uuid;index" json:"campaign_id"`
	UTMSource  string     `gorm:"size:100;index:idx_page_visit_day,unique" json:"utm_source"`
	Date       string     `gorm:"size:10;index:idx_page_visit_day,unique" json:"date"` // YYYY-MM-DD
	Count      int64      `gorm:"default:0" json:"count"`
	CreatedAt  time.Time  `json:"created_at"`
	UpdatedAt  time.Time  `json:"updated_at"`
}
