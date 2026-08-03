package database

import (
	"encoding/json"
	"fmt"
	"log"
	"strings"

	"github.com/anrdart/niatbaik-api/internal/model"
	"github.com/anrdart/niatbaik-api/pkg/username"
	"gorm.io/gorm"
)

func Migrate(db *gorm.DB) error {
	db.Exec(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`)

	// Disable FK constraints at the database level so table creation order doesn't matter
	db.Exec("SET CONSTRAINTS ALL DEFERRED")

	// Use DisableForeignKeyConstraintWhenMigrating to avoid FK ordering issues
	migrator := db.Session(&gorm.Session{}).Set("gorm:table_options", "")
	migrator.Config.DisableForeignKeyConstraintWhenMigrating = true

	err := migrator.AutoMigrate(
		&model.User{},
		&model.Category{},
		&model.PaymentMethod{},
		&model.Setting{},
		&model.Province{},
		&model.Post{},
		&model.Page{},
		&model.Slide{},
		&model.FinancialReport{},
		&model.PasswordResetToken{},
		&model.Campaign{},
		&model.Notification{},
		&model.NotificationRead{},
		&model.ActivityLog{},
		&model.LoginHistory{},
		&model.FundraiserClick{},
		&model.Commission{},
		&model.CampaignUpdate{},
		&model.CampaignFund{},
		&model.Invoice{},
		&model.Fundraiser{},
		&model.Love{},
		&model.Withdrawal{},
		&model.Donation{},
		&model.AdCost{},
		&model.PixelEvent{},
		&model.TrackingDispatchLog{},
		&model.RevokedToken{},
		&model.PaymentStatus{},
		&model.ProcessedWebhook{},
		&model.PageVisit{},
		&model.SiteContent{},
	)
	if err != nil {
		return fmt.Errorf("auto-migration failed: %w", err)
	}

	if err := db.Exec(googleAdsAuditMigrationSQL()).Error; err != nil {
		return fmt.Errorf("backfill Google Ads conversion statuses: %w", err)
	}

	// KYC/verification feature removed: drop its table and the users.verification_status
	// column. Idempotent (IF EXISTS) so it's safe on fresh DBs and re-runs. AutoMigrate
	// never drops columns/tables on its own, so this is required to actually reclaim them.
	db.Exec(`DROP TABLE IF EXISTS verification_details`)
	db.Exec(`ALTER TABLE users DROP COLUMN IF EXISTS verification_status`)

	if err := backfillUsernames(db); err != nil {
		// Non-fatal: a backfill hiccup shouldn't block boot. Log and continue — un-backfilled
		// users simply have a NULL username until they (or an admin) set one.
		log.Printf("username backfill warning: %v", err)
	}

	// NOTE: site_content is intentionally NOT seeded. The table is created empty; the public
	// homepage renders its built-in fallbacks until an admin fills a section in Settings →
	// Homepage (the admin form is pre-populated with those same defaults to edit from).

	// Backfill posted_at for legacy campaigns that predate PostedAt being set on create, so
	// "sisa hari" computes correctly once a duration is present (was collapsing to 0).
	db.Exec(`UPDATE campaigns SET posted_at = created_at WHERE posted_at IS NULL`)

	if err := backfillTrackingConfig(db); err != nil {
		// Non-fatal: unified trackers fall back to the discrete fields at render time,
		// so a backfill hiccup never breaks tracking.
		log.Printf("tracking_config backfill warning: %v", err)
	}

	log.Println("Database migrations completed")
	return nil
}

// backfillTrackingConfig seeds the unified tracking_config array from the legacy
// discrete pixel fields, once. Idempotent: only rows with an empty tracking_config
// are touched, so re-runs are no-ops and an admin who already curated the array is
// never overwritten.
func backfillTrackingConfig(db *gorm.DB) error {
	var settings []model.Setting
	if err := db.Where("tracking_config IS NULL OR tracking_config = ''").Find(&settings).Error; err != nil {
		return err
	}
	for i := range settings {
		s := &settings[i]
		type tracker struct {
			Type  string `json:"type"`
			Value string `json:"value"`
			Label string `json:"label,omitempty"`
		}
		var arr []tracker
		add := func(typ, value, label string) {
			if strings.TrimSpace(value) == "" {
				return
			}
			arr = append(arr, tracker{Type: typ, Value: strings.TrimSpace(value), Label: strings.TrimSpace(label)})
		}
		add("gtm", s.GTMID, "")
		add("meta", s.MetaPixelID, "")
		add("ga4", s.GA4MeasurementID, "")
		add("tiktok", s.TiktokPixelID, "")
		// google_ads only backfills when a label exists — a conversion tag without a
		// label can't fire, so it's not a valid unified entry.
		if strings.TrimSpace(s.GoogleAdsConversionID) != "" && strings.TrimSpace(s.GoogleAdsConversionLabel) != "" {
			add("google_ads", s.GoogleAdsConversionID, s.GoogleAdsConversionLabel)
		}
		if len(arr) == 0 {
			continue
		}
		encoded, err := json.Marshal(arr)
		if err != nil {
			return err
		}
		if err := db.Model(&model.Setting{}).Where("id = ?", s.ID).Update("tracking_config", string(encoded)).Error; err != nil {
			return err
		}
	}
	return nil
}

// backfillUsernames assigns a unique username to every existing user that lacks one,
// derived from the email local-part (fallback: name). Idempotent — it only touches rows
// where username IS NULL, so re-runs on an already-backfilled DB are no-ops.
func backfillUsernames(db *gorm.DB) error {
	var users []model.User
	if err := db.Where("username IS NULL OR username = ''").Find(&users).Error; err != nil {
		return err
	}
	for i := range users {
		u := &users[i]
		seed := u.Email
		if at := strings.IndexByte(seed, '@'); at > 0 {
			seed = seed[:at]
		}
		if strings.TrimSpace(seed) == "" {
			seed = u.Name
		}
		// checkExists must also reject values we just assigned in THIS loop, so query the DB
		// each time (usernameByPending mirror avoided — the write below makes it visible).
		uname := username.GenerateUnique(seed, func(candidate string) bool {
			var c int64
			db.Model(&model.User{}).Where("username = ?", candidate).Count(&c)
			return c > 0
		})
		if err := db.Model(&model.User{}).Where("id = ?", u.ID).Update("username", uname).Error; err != nil {
			return err
		}
	}
	return nil
}

func googleAdsAuditMigrationSQL() string {
	return `UPDATE invoices SET
 google_ads_client_attempted_at = COALESCE(google_ads_client_attempted_at, google_ads_conversion_attempted_at),
 google_ads_server_status = CASE
 WHEN google_ads_server_status = 'server_sent' OR google_ads_conversion_status = 'server_sent' THEN 'server_sent'
 WHEN is_paid = FALSE THEN COALESCE(google_ads_server_status, '')
 WHEN BTRIM(COALESCE(gclid,'')) = '' AND BTRIM(COALESCE(gbraid,'')) = '' AND BTRIM(COALESCE(wbraid,'')) = '' THEN 'not_attributed'
 WHEN google_ads_server_upload_enabled_snapshot = TRUE AND BTRIM(COALESCE(google_ads_customer_id_snapshot,'')) <> '' AND BTRIM(COALESCE(google_ads_conversion_action_id_snapshot,'')) <> '' THEN 'pending_upload'
 ELSE 'pending_configuration' END,
 google_ads_server_next_attempt_at = CASE WHEN google_ads_server_status = 'server_sent' OR google_ads_conversion_status = 'server_sent' THEN google_ads_server_next_attempt_at WHEN is_paid AND google_ads_server_upload_enabled_snapshot AND BTRIM(COALESCE(google_ads_customer_id_snapshot,'')) <> '' AND BTRIM(COALESCE(google_ads_conversion_action_id_snapshot,'')) <> '' AND (BTRIM(COALESCE(gclid,'')) <> '' OR BTRIM(COALESCE(gbraid,'')) <> '' OR BTRIM(COALESCE(wbraid,'')) <> '') THEN COALESCE(google_ads_server_next_attempt_at,NOW()) ELSE google_ads_server_next_attempt_at END
 WHERE is_paid = TRUE OR google_ads_conversion_attempted_at IS NOT NULL OR google_ads_conversion_status = 'server_sent'`
}
