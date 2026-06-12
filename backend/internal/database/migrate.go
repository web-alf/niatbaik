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
		&model.ActivityLog{},
		&model.LoginHistory{},
		&model.FundraiserClick{},
		&model.Commission{},
		&model.VerificationDetail{},
		&model.CampaignUpdate{},
		&model.CampaignFund{},
		&model.Invoice{},
		&model.Fundraiser{},
		&model.Love{},
		&model.Withdrawal{},
		&model.Donation{},
		&model.AdCost{},
		&model.PixelEvent{},
		&model.RevokedToken{},
		&model.PaymentStatus{},
	)
	if err != nil {
		return fmt.Errorf("auto-migration failed: %w", err)
	}

	log.Println("Database migrations completed")
	return nil
}
