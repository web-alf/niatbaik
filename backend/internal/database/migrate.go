package database

import (
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
	)
	if err != nil {
		return fmt.Errorf("auto-migration failed: %w", err)
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

	log.Println("Database migrations completed")
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
