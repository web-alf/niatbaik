package service

import (
	"fmt"
	"time"

	"github.com/anrdart/niatbaik-api/internal/model"
	"github.com/anrdart/niatbaik-api/internal/repository"
	"gorm.io/gorm"
)

type PaymentService struct {
	db             *gorm.DB
	invoiceRepo    *repository.InvoiceRepo
	campaignRepo   *repository.CampaignRepo
	settingRepo    *repository.SettingRepo
	fundraiserRepo *repository.FundraiserRepo
	commissionRepo *repository.CommissionRepo
}

func NewPaymentService(
	db *gorm.DB,
	invoiceRepo *repository.InvoiceRepo,
	campaignRepo *repository.CampaignRepo,
	settingRepo *repository.SettingRepo,
	fundraiserRepo *repository.FundraiserRepo,
	commissionRepo *repository.CommissionRepo,
) *PaymentService {
	return &PaymentService{
		db:             db,
		invoiceRepo:    invoiceRepo,
		campaignRepo:   campaignRepo,
		settingRepo:    settingRepo,
		fundraiserRepo: fundraiserRepo,
		commissionRepo: commissionRepo,
	}
}

func (s *PaymentService) ProcessPayment(invoice *model.Invoice) error {
	return s.db.Transaction(func(tx *gorm.DB) error {
		settings, err := s.settingRepo.Get()
		if err != nil {
			return fmt.Errorf("failed to get settings: %w", err)
		}

		adminFee := int64(settings.AdminFee)
		now := time.Now()

		// Mark invoice paid
		invoice.IsPaid = true
		invoice.Status = "Terbayar"
		invoice.PaidAt = &now
		invoice.ReminderSentAt = nil
		if err := tx.Save(invoice).Error; err != nil {
			return fmt.Errorf("failed to update invoice: %w", err)
		}

		campaignReceives := invoice.Subtotal - adminFee
		masterReceives := invoice.Total - adminFee

		// Handle referral commission
		if invoice.ReferredBy != nil && !invoice.ReferralProcessed {
			commissionPercent := int64(settings.FundraiserCommissionPercent)
			commissionAmount := (campaignReceives * commissionPercent) / 100

			// Update fundraiser total_raised
			if err := tx.Model(&model.Fundraiser{}).
				Where("user_id = ?", *invoice.ReferredBy).
				UpdateColumn("total_raised", gorm.Expr("total_raised + ?", invoice.Subtotal)).Error; err != nil {
				return fmt.Errorf("failed to update fundraiser: %w", err)
			}

			// Update referrer bonus_balance
			if err := tx.Model(&model.User{}).
				Where("id = ?", *invoice.ReferredBy).
				UpdateColumn("bonus_balance", gorm.Expr("bonus_balance + ?", commissionAmount)).Error; err != nil {
				return fmt.Errorf("failed to update referrer balance: %w", err)
			}

			// Create commission record
			commission := model.Commission{
				UserID:      *invoice.ReferredBy,
				Description: fmt.Sprintf("Bonus Komisi Dari Donasi %s", invoice.DonorName),
				Amount:      commissionAmount,
				EarnedAt:    now,
			}
			if err := tx.Create(&commission).Error; err != nil {
				return fmt.Errorf("failed to create commission: %w", err)
			}

			campaignReceives -= commissionAmount

			invoice.ReferralProcessed = true
			if err := tx.Model(invoice).UpdateColumn("referral_processed", true).Error; err != nil {
				return fmt.Errorf("failed to mark referral processed: %w", err)
			}
		}

		// Update campaign total_raised
		campaign := &invoice.Campaign
		newBalance := campaign.TotalRaised + campaignReceives
		if err := tx.Model(campaign).UpdateColumn("total_raised", newBalance).Error; err != nil {
			return fmt.Errorf("failed to update campaign balance: %w", err)
		}

		// Create campaign fund record
		fund := model.CampaignFund{
			CampaignID:  campaign.ID,
			AmountIn:    campaignReceives,
			Description: fmt.Sprintf("Donasi Dari : %s", invoice.DonorName),
			Month:       int(now.Month()),
			Year:        now.Year(),
			Balance:     newBalance,
		}
		if err := tx.Create(&fund).Error; err != nil {
			return fmt.Errorf("failed to create campaign fund: %w", err)
		}

		// Create global financial report
		globalBalance := settings.TotalMoney + masterReceives
		amountIn := masterReceives
		report := model.FinancialReport{
			Description: fmt.Sprintf("Donasi Dari : %s Ke Program %s", invoice.DonorName, campaign.Title),
			AmountIn:    &amountIn,
			Month:       int(now.Month()),
			Year:        now.Year(),
			Balance:     globalBalance,
		}
		if err := tx.Create(&report).Error; err != nil {
			return fmt.Errorf("failed to create financial report: %w", err)
		}

		// Update settings total_money
		if err := tx.Model(settings).UpdateColumn("total_money", globalBalance).Error; err != nil {
			return fmt.Errorf("failed to update total money: %w", err)
		}

		return nil
	})
}
