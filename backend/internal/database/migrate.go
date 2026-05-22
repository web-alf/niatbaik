package database

import (
	"fmt"

	"github.com/anrdart/niatbaik-api/internal/model"
	"gorm.io/gorm"
)

func Migrate(db *gorm.DB) error {
	err := db.AutoMigrate(
		&model.User{},
		&model.Category{},
		&model.Campaign{},
		&model.CampaignUpdate{},
		&model.CampaignFund{},
		&model.PaymentMethod{},
		&model.Invoice{},
		&model.Donation{},
		&model.Fundraiser{},
		&model.FundraiserClick{},
		&model.Commission{},
		&model.Withdrawal{},
		&model.Love{},
		&model.VerificationDetail{},
		&model.Setting{},
		&model.Post{},
		&model.Page{},
		&model.Slide{},
		&model.FinancialReport{},
		&model.Notification{},
		&model.ActivityLog{},
		&model.LoginHistory{},
		&model.PasswordResetToken{},
	)
	if err != nil {
		return fmt.Errorf("auto-migration failed: %w", err)
	}
	return nil
}
