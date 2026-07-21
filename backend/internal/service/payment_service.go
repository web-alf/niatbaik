package service

import (
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/anrdart/niatbaik-api/internal/model"
	"github.com/anrdart/niatbaik-api/internal/repository"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

func initializeGoogleAdsConversionStatus(inv *model.Invoice) {
	if inv.GoogleAdsConversionStatus != "" {
		return
	}
	if strings.TrimSpace(inv.Gclid) == "" {
		inv.GoogleAdsConversionStatus = model.GoogleAdsConversionNotAttributed
		return
	}
	inv.GoogleAdsConversionStatus = model.GoogleAdsConversionPendingCredentials
}

func clearGoogleAdsConversionAudit(inv *model.Invoice) {
	inv.GoogleAdsConversionStatus = ""
	inv.GoogleAdsConversionAttemptedAt = nil
	inv.GoogleAdsConversionSentAt = nil
	inv.GoogleAdsConversionError = ""
}

type PaymentService struct {
	db             *gorm.DB
	invoiceRepo    *repository.InvoiceRepo
	campaignRepo   *repository.CampaignRepo
	settingRepo    *repository.SettingRepo
	fundraiserRepo *repository.FundraiserRepo
	commissionRepo *repository.CommissionRepo
	trackingSvc    *TrackingService
}

func NewPaymentService(
	db *gorm.DB,
	invoiceRepo *repository.InvoiceRepo,
	campaignRepo *repository.CampaignRepo,
	settingRepo *repository.SettingRepo,
	fundraiserRepo *repository.FundraiserRepo,
	commissionRepo *repository.CommissionRepo,
	trackingSvc *TrackingService,
) *PaymentService {
	return &PaymentService{
		db:             db,
		invoiceRepo:    invoiceRepo,
		campaignRepo:   campaignRepo,
		settingRepo:    settingRepo,
		fundraiserRepo: fundraiserRepo,
		commissionRepo: commissionRepo,
		trackingSvc:    trackingSvc,
	}
}

func (s *PaymentService) ProcessPayment(invoice *model.Invoice) error {
	err := s.db.Transaction(func(tx *gorm.DB) error {
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
		initializeGoogleAdsConversionStatus(&lockedInvoice)

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
		lockedInvoice.MasterCredited = masterReceives

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
			lockedInvoice.CommissionCredited = commissionAmount

			// Scope to the fundraiser's affiliate record FOR THIS CAMPAIGN (a user can be a
			// fundraiser on several campaigns). Bump raised + donor/paid counts so the
			// affiliate stats reflect reality — previously this matched user_id only (wrong
			// campaign's row could be hit) and only touched total_raised.
			if err := tx.Model(&model.Fundraiser{}).
				Where("user_id = ? AND campaign_id = ?", *lockedInvoice.ReferredBy, lockedInvoice.CampaignID).
				UpdateColumns(map[string]interface{}{
					"total_raised":  gorm.Expr("total_raised + ?", lockedInvoice.Subtotal),
					"total_donors":  gorm.Expr("total_donors + 1"),
					"invoices_paid": gorm.Expr("invoices_paid + 1"),
				}).Error; err != nil {
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

			// Persisted by the single tx.Save(&lockedInvoice) below (alongside the credited
			// snapshots), so no separate UpdateColumn is needed here.
			lockedInvoice.ReferralProcessed = true
		}

		// Snapshot the exact figure credited to the campaign (post fee + commission) so a
		// future revert reverses this identical amount, and persist the paid state + all
		// three credited snapshots + referral_processed in ONE write (moved here from step 2
		// so the snapshots are populated when the row is saved).
		lockedInvoice.CampaignCredited = campaignReceives
		lockedInvoice.PaymentSnapshotted = true
		if err := tx.Save(&lockedInvoice).Error; err != nil {
			return fmt.Errorf("failed to update invoice: %w", err)
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
	if err != nil {
		return err
	}

	// Transaction committed = invoice is genuinely paid. Fire server-side conversion
	// events in a goroutine so a slow/down Meta/TikTok never blocks payment confirmation.
	// Snapshot the invoice value (the caller's pointer may be reused later). Anonymous
	// donations still fire — value/currency + event_id are enough for attribution, and
	// their PII fields are simply empty in the hashed user_data (valid for Meta/TikTok).
	if s.trackingSvc != nil {
		snap := *invoice
		go func() {
			defer func() {
				if r := recover(); r != nil {
					log.Printf("[tracking] SendConversions panic: %v", r)
				}
			}()
			s.trackingSvc.SendConversions(&snap)
		}()
	}
	return nil
}

// ReversePayment undoes the bookkeeping that ProcessPayment applied when this invoice was
// settled, then flips it back to the given (unpaid) status. It is the counterpart used
// when an admin/CS marks a previously-paid invoice as unpaid. It reverses the SAME amounts
// that were credited (read from the *_credited snapshots on the invoice) — so a
// since-changed admin fee or commission % can't cause drift. The only exception is
// pre-snapshot legacy invoices (PaymentSnapshotted=false), where it best-effort recomputes.
//
// Safety guards (all inside one locked transaction):
//   - Re-loads the invoice FOR UPDATE and no-ops unless it is currently paid, so a
//     concurrent/double revert can't decrement the ledgers twice.
//   - REFUSES the revert if it would drive campaign.TotalRaised or settings.TotalMoney
//     negative — that means the funds were already disbursed (a withdrawal), and silently
//     clamping to zero would hide real money. The caller surfaces this as an error.
//   - Claws back referrer commission only up to the still-available bonus_balance (the
//     rest may already have been paid out), never below zero.
//   - Resets referral_processed so a genuine later re-payment re-credits commission.
//
// Ledger rows (CampaignFund / FinancialReport / Commission) are append-only: a compensating
// (negative / AmountOut) row is written rather than deleting the original, preserving audit
// history. The stored balance columns remain the single source of truth.
func (s *PaymentService) ReversePayment(invoice *model.Invoice, newStatus string) error {
	return s.db.Transaction(func(tx *gorm.DB) error {
		now := time.Now()

		var inv model.Invoice
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
			First(&inv, "id = ?", invoice.ID).Error; err != nil {
			return fmt.Errorf("failed to lock invoice: %w", err)
		}
		if !inv.IsPaid {
			// Already unpaid (or a racing revert won) — just set the requested label and stop.
			return tx.Model(&inv).Updates(map[string]any{"status": newStatus}).Error
		}

		// Lock the settings singleton FIRST, unconditionally. This (a) is needed by the
		// legacy recompute and the foundation-balance decrement below, and (b) pins the lock
		// order to settings→campaign, matching ProcessPayment — so a concurrent pay/unpay
		// toggle on the same campaign can't deadlock (opposite orders would). Settings is a
		// singleton row; locking it on a revert that doesn't touch TotalMoney is harmless.
		var settings model.Setting
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&settings).Error; err != nil {
			return fmt.Errorf("failed to lock settings: %w", err)
		}

		// Legacy fallback: invoices settled BEFORE the snapshot columns existed have
		// PaymentSnapshotted=false; best-effort recompute from live settings (same formula
		// ProcessPayment used). This can drift if the admin fee / commission % changed since,
		// but it's strictly better than not reversing, and only affects the one-time backlog
		// of pre-deploy paid invoices. A freshly-settled invoice that legitimately credited
		// zero (e.g. Subtotal <= adminFee) is NOT legacy — the flag disambiguates, so we
		// never recompute (and risk over-decrementing) a real all-zero settlement.
		if !inv.PaymentSnapshotted {
			adminFee := int64(settings.AdminFee)
			campaignReceives := inv.Subtotal - adminFee
			if campaignReceives < 0 {
				campaignReceives = 0
			}
			masterReceives := inv.Total - adminFee
			if masterReceives < 0 {
				masterReceives = 0
			}
			var commissionAmount int64
			if inv.ReferredBy != nil && inv.ReferralProcessed {
				pct := int64(settings.FundraiserCommissionPercent)
				if pct < 0 {
					pct = 0
				} else if pct > 100 {
					pct = 100
				}
				commissionAmount = (campaignReceives * pct) / 100
				campaignReceives -= commissionAmount
				if campaignReceives < 0 {
					campaignReceives = 0
				}
			}
			inv.CampaignCredited = campaignReceives
			inv.MasterCredited = masterReceives
			inv.CommissionCredited = commissionAmount
		}

		// 1. Campaign balance — refuse if the credited amount was already disbursed.
		if inv.CampaignCredited > 0 {
			var campaign model.Campaign
			if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
				First(&campaign, "id = ?", inv.CampaignID).Error; err != nil {
				return fmt.Errorf("failed to lock campaign: %w", err)
			}
			if campaign.TotalRaised < inv.CampaignCredited {
				return fmt.Errorf("tidak bisa membatalkan: dana campaign untuk donasi ini sudah dicairkan")
			}
			newBalance := campaign.TotalRaised - inv.CampaignCredited
			campaign.TotalRaised = newBalance
			if err := tx.Save(&campaign).Error; err != nil {
				return fmt.Errorf("failed to reverse campaign balance: %w", err)
			}
			out := inv.CampaignCredited
			if err := tx.Create(&model.CampaignFund{
				CampaignID:  campaign.ID,
				AmountOut:   out,
				Description: fmt.Sprintf("Koreksi: donasi %s dibatalkan (%s)", inv.InvoiceNumber, inv.DonorName),
				Month:       int(now.Month()),
				Year:        now.Year(),
				Balance:     newBalance,
			}).Error; err != nil {
				return fmt.Errorf("failed to record campaign reversal: %w", err)
			}
		}

		// 2. Global foundation balance — uses the settings row already locked above.
		if inv.MasterCredited > 0 {
			if settings.TotalMoney < inv.MasterCredited {
				return fmt.Errorf("tidak bisa membatalkan: saldo yayasan untuk donasi ini sudah dicairkan")
			}
			globalBalance := settings.TotalMoney - inv.MasterCredited
			settings.TotalMoney = globalBalance
			if err := tx.Save(&settings).Error; err != nil {
				return fmt.Errorf("failed to reverse total money: %w", err)
			}
			out := inv.MasterCredited
			if err := tx.Create(&model.FinancialReport{
				Description: fmt.Sprintf("Koreksi: donasi %s dibatalkan (%s)", inv.InvoiceNumber, inv.DonorName),
				AmountOut:   &out,
				Month:       int(now.Month()),
				Year:        now.Year(),
				Balance:     globalBalance,
			}).Error; err != nil {
				return fmt.Errorf("failed to record financial reversal: %w", err)
			}
		}

		// 3. Fundraiser commission + affiliate counters (only if it was actually processed).
		if inv.ReferredBy != nil && inv.ReferralProcessed {
			// Affiliate counters — scoped to (user, campaign), mirroring the credit path.
			if err := tx.Model(&model.Fundraiser{}).
				Where("user_id = ? AND campaign_id = ?", *inv.ReferredBy, inv.CampaignID).
				UpdateColumns(map[string]interface{}{
					"total_raised":  gorm.Expr("GREATEST(total_raised - ?, 0)", inv.Subtotal),
					"total_donors":  gorm.Expr("GREATEST(total_donors - 1, 0)"),
					"invoices_paid": gorm.Expr("GREATEST(invoices_paid - 1, 0)"),
				}).Error; err != nil {
				return fmt.Errorf("failed to reverse fundraiser counters: %w", err)
			}

			if inv.CommissionCredited > 0 {
				// Claw back only what's still unwithdrawn — the referrer may have already
				// cashed part of it out (bonus_balance moved to bonus_withdrawn on payout).
				var user model.User
				if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
					First(&user, "id = ?", *inv.ReferredBy).Error; err != nil {
					return fmt.Errorf("failed to lock referrer: %w", err)
				}
				clawback := inv.CommissionCredited
				if user.BonusBalance < clawback {
					clawback = user.BonusBalance
				}
				if clawback > 0 {
					if err := tx.Model(&user).
						UpdateColumn("bonus_balance", gorm.Expr("bonus_balance - ?", clawback)).Error; err != nil {
						return fmt.Errorf("failed to reverse referrer balance: %w", err)
					}
				}
				// The compensating ledger row records the amount ACTUALLY clawed back, not the
				// full original commission. If the referrer already withdrew part of it, that
				// cash stayed in bonus_withdrawn; writing -CommissionCredited here would make
				// SUM(commission) (total_commission) disagree with bonus_balance+bonus_withdrawn.
				if clawback > 0 {
					if err := tx.Create(&model.Commission{
						UserID:      *inv.ReferredBy,
						Description: fmt.Sprintf("Koreksi: pembatalan donasi %s", inv.DonorName),
						Amount:      -clawback,
						EarnedAt:    now,
					}).Error; err != nil {
						return fmt.Errorf("failed to record commission reversal: %w", err)
					}
				}
			}
		}

		// 4. Flip the invoice unpaid, clear the snapshots + referral flag so a later
		//    re-payment starts clean and re-credits everything correctly.
		if err := tx.Model(&inv).Updates(map[string]any{
			"status":                             newStatus,
			"is_paid":                            false,
			"paid_at":                            nil,
			"referral_processed":                 false,
			"payment_snapshotted":                false,
			"campaign_credited":                  0,
			"master_credited":                    0,
			"commission_credited":                0,
			"google_ads_conversion_status":       "",
			"google_ads_conversion_attempted_at": nil,
			"google_ads_conversion_sent_at":      nil,
			"google_ads_conversion_error":        "",
		}).Error; err != nil {
			return fmt.Errorf("failed to reverse invoice status: %w", err)
		}

		invoice.IsPaid = false
		invoice.Status = newStatus
		return nil
	})
}
