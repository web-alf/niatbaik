package database

import (
	"fmt"
	"log"

	"github.com/anrdart/niatbaik-api/internal/model"
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

	log.Println("Database migrations completed")
	return nil
}
