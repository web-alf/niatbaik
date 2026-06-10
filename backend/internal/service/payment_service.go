package service

import (
	"fmt"
	"time"

	"github.com/anrdart/niatbaik-api/internal/model"
	"github.com/anrdart/niatbaik-api/internal/repository"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
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
		now := time.Now()

		// Idempotency guard: re-load invoice under lock and bail if already paid.
		var lockedInvoice model.Invoice
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
			First(&lockedInvoice, "id = ?", invoice.ID).Error; err != nil {
			return fmt.Errorf("failed to lock invoice: %w", err)
		}
		if lockedInvoice.IsPaid {
			return nil // already processed — no double credit
		}

		// 1. Lock settings row to safely read+update global balance.
		var settings model.Setting
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&settings).Error; err != nil {
			return fmt.Errorf("failed to lock settings: %w", err)
		}
		adminFee := int64(settings.AdminFee)

		// 2. Mark invoice paid.
		lockedInvoice.IsPaid = true
		lockedInvoice.Status = "Terbayar"
		lockedInvoice.PaidAt = &now
		lockedInvoice.ReminderSentAt = nil
		if err := tx.Save(&lockedInvoice).Error; err != nil {
			return fmt.Errorf("failed to update invoice: %w", err)
		}

		// Guard against a misconfigured admin fee corrupting balances: a fee larger
		// than the donation must never make the campaign/org "receive" a negative
		// amount (which would inflate their running balance). Clamp to zero.
		campaignReceives := lockedInvoice.Subtotal - adminFee
		if campaignReceives < 0 {
			campaignReceives = 0
		}
		// masterReceives uses Total (Subtotal + unique transfer code) because, for
		// manual bank transfers, the org actually receives the full transferred
		// amount; for gateway payments uniqueCode is 0 so Total == Subtotal.
		masterReceives := lockedInvoice.Total - adminFee
		if masterReceives < 0 {
			masterReceives = 0
		}

		// 3. Handle referral commission.
		if lockedInvoice.ReferredBy != nil && !lockedInvoice.ReferralProcessed {
			commissionPercent := int64(settings.FundraiserCommissionPercent)
			// Clamp percent to a sane 0..100 range so a bad setting can't pay out a
			// negative commission (which would silently drain a referrer's balance)
			// or an absurd one.
			if commissionPercent < 0 {
				commissionPercent = 0
			} else if commissionPercent > 100 {
				commissionPercent = 100
			}
			commissionAmount := (campaignReceives * commissionPercent) / 100

			if err := tx.Model(&model.Fundraiser{}).
				Where("user_id = ?", *lockedInvoice.ReferredBy).
				UpdateColumn("total_raised", gorm.Expr("total_raised + ?", lockedInvoice.Subtotal)).Error; err != nil {
				return fmt.Errorf("failed to update fundraiser: %w", err)
			}

			if err := tx.Model(&model.User{}).
				Where("id = ?", *lockedInvoice.ReferredBy).
				UpdateColumn("bonus_balance", gorm.Expr("bonus_balance + ?", commissionAmount)).Error; err != nil {
				return fmt.Errorf("failed to update referrer balance: %w", err)
			}

			commission := model.Commission{
				UserID:      *lockedInvoice.ReferredBy,
				Description: fmt.Sprintf("Bonus Komisi Dari Donasi %s", lockedInvoice.DonorName),
				Amount:      commissionAmount,
				EarnedAt:    now,
			}
			if err := tx.Create(&commission).Error; err != nil {
				return fmt.Errorf("failed to create commission: %w", err)
			}

			// Commission comes out of the campaign's share; re-clamp in case the
			// commission exceeds what's left so the campaign balance never goes negative.
			campaignReceives -= commissionAmount
			if campaignReceives < 0 {
				campaignReceives = 0
			}

			if err := tx.Model(&lockedInvoice).UpdateColumn("referral_processed", true).Error; err != nil {
				return fmt.Errorf("failed to mark referral processed: %w", err)
			}
		}

		// 4. Lock campaign row, read fresh balance, then update.
		var campaign model.Campaign
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
			First(&campaign, "id = ?", lockedInvoice.CampaignID).Error; err != nil {
			return fmt.Errorf("failed to lock campaign: %w", err)
		}
		newBalance := campaign.TotalRaised + campaignReceives
		campaign.TotalRaised = newBalance
		if err := tx.Save(&campaign).Error; err != nil {
			return fmt.Errorf("failed to update campaign balance: %w", err)
		}

		// 5. Record campaign cash-in mutation.
		fund := model.CampaignFund{
			CampaignID:  campaign.ID,
			AmountIn:    campaignReceives,
			Description: fmt.Sprintf("Donasi Dari : %s", lockedInvoice.DonorName),
			Month:       int(now.Month()),
			Year:        now.Year(),
			Balance:     newBalance,
		}
		if err := tx.Create(&fund).Error; err != nil {
			return fmt.Errorf("failed to create campaign fund: %w", err)
		}

		// 6. Update global balance + financial report.
		globalBalance := settings.TotalMoney + masterReceives
		amountIn := masterReceives
		report := model.FinancialReport{
			Description: fmt.Sprintf("Donasi Dari : %s Ke Program %s", lockedInvoice.DonorName, campaign.Title),
			AmountIn:    &amountIn,
			Month:       int(now.Month()),
			Year:        now.Year(),
			Balance:     globalBalance,
		}
		if err := tx.Create(&report).Error; err != nil {
			return fmt.Errorf("failed to create financial report: %w", err)
		}

		settings.TotalMoney = globalBalance
		if err := tx.Save(&settings).Error; err != nil {
			return fmt.Errorf("failed to update total money: %w", err)
		}

		// Reflect paid state back to caller's invoice pointer.
		invoice.IsPaid = true
		invoice.Status = lockedInvoice.Status
		invoice.PaidAt = lockedInvoice.PaidAt

		return nil
	})
}
