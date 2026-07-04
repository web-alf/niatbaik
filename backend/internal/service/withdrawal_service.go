package service

import (
	"errors"
	"fmt"
	"time"

	"github.com/anrdart/niatbaik-api/internal/dto/request"
	"github.com/anrdart/niatbaik-api/internal/model"
	"github.com/anrdart/niatbaik-api/internal/repository"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type WithdrawalService struct {
	db             *gorm.DB
	withdrawalRepo *repository.WithdrawalRepo
}

func NewWithdrawalService(db *gorm.DB, withdrawalRepo *repository.WithdrawalRepo) *WithdrawalService {
	return &WithdrawalService{db: db, withdrawalRepo: withdrawalRepo}
}

// CreateRequest lets a verified campaign owner request a payout, validating
// ownership and that the requested amount does not exceed withdrawable balance.
func (s *WithdrawalService) CreateRequest(userID uuid.UUID, req *request.CreateWithdrawalRequest) (*model.Withdrawal, error) {
	if req.Amount <= 0 {
		return nil, errors.New("nominal penarikan harus lebih dari nol")
	}
	// Bonus/commission payout (fundraiser): no campaign, drawn from the user's
	// bonus_balance minus what's already reserved by pending bonus withdrawals.
	if req.CampaignID == nil {
		return s.createBonusRequest(userID, req)
	}

	var created model.Withdrawal
	// Wrap the whole check-and-create in a transaction and lock the campaign row, so
	// two concurrent requests can't each read the same stale "available balance" and
	// both pass the check (TOCTOU) — which would queue payouts summing to more than
	// was raised. The lock serializes them; the second sees the first's reserved funds.
	err := s.db.Transaction(func(tx *gorm.DB) error {
		var campaign model.Campaign
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
			First(&campaign, "id = ? AND user_id = ?", *req.CampaignID, userID).Error; err != nil {
			return errors.New("campaign not found or access denied")
		}

		// Withdrawable = total raised - withdrawals still tied up. Completed ("Selesai")
		// withdrawals are ALREADY deducted from campaign.TotalRaised in Approve(), so they
		// must NOT be subtracted again here — that double-counted every past payout and
		// progressively understated the available balance, eventually blocking legitimate
		// withdrawals. Only pending/queued statuses still reserve funds against TotalRaised.
		var totalWithdrawn int64
		tx.Model(&model.Withdrawal{}).
			Where("campaign_id = ? AND status IN ?", *req.CampaignID, []string{"Dalam Antrian", "Menunggu"}).
			Select("COALESCE(SUM(amount), 0)").Scan(&totalWithdrawn)

		availableBalance := campaign.TotalRaised - totalWithdrawn
		if req.Amount > availableBalance {
			return fmt.Errorf("dana tidak mencukupi, sisa saldo yang dapat ditarik: Rp %d", availableBalance)
		}

		now := time.Now()
		created = model.Withdrawal{
			UserID:      userID,
			CampaignID:  req.CampaignID,
			BankType:    req.BankType,
			BankNumber:  req.BankNumber,
			BankName:    req.BankName,
			Amount:      req.Amount,
			Status:      "Dalam Antrian",
			RequestedAt: &now,
		}
		return tx.Create(&created).Error
	})
	if err != nil {
		return nil, err
	}
	return &created, nil
}

// createBonusRequest queues a fundraiser commission payout against the user's bonus_balance.
// Locks the user row so concurrent requests can't both pass the balance check; available =
// bonus_balance minus amounts already reserved by pending (unpaid) bonus withdrawals.
func (s *WithdrawalService) createBonusRequest(userID uuid.UUID, req *request.CreateWithdrawalRequest) (*model.Withdrawal, error) {
	var created model.Withdrawal
	err := s.db.Transaction(func(tx *gorm.DB) error {
		var user model.User
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&user, "id = ?", userID).Error; err != nil {
			return errors.New("user not found")
		}

		var reserved int64
		tx.Model(&model.Withdrawal{}).
			Where("user_id = ? AND campaign_id IS NULL AND status IN ?", userID, []string{"Dalam Antrian", "Menunggu"}).
			Select("COALESCE(SUM(amount), 0)").Scan(&reserved)

		available := user.BonusBalance - reserved
		if req.Amount > available {
			return fmt.Errorf("saldo komisi tidak mencukupi, sisa yang dapat ditarik: Rp %d", available)
		}

		now := time.Now()
		created = model.Withdrawal{
			UserID:      userID,
			CampaignID:  nil, // bonus withdrawal
			BankType:    req.BankType,
			BankNumber:  req.BankNumber,
			BankName:    req.BankName,
			Amount:      req.Amount,
			Status:      "Dalam Antrian",
			RequestedAt: &now,
		}
		return tx.Create(&created).Error
	})
	if err != nil {
		return nil, err
	}
	return &created, nil
}

// Approve completes a withdrawal: locks campaign + settings, verifies balance,
// deducts both campaign and foundation balances, and records cash-out mutations.
func (s *WithdrawalService) Approve(id uuid.UUID) error {
	return s.db.Transaction(func(tx *gorm.DB) error {
		var w model.Withdrawal
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&w, "id = ?", id).Error; err != nil {
			return errors.New("withdrawal not found")
		}
		if w.Status == "Selesai" {
			return errors.New("withdrawal already completed")
		}

		// Bonus/commission payout (fundraiser, no campaign): settle from the user's
		// bonus_balance and move it into bonus_withdrawn. Lock the user row first.
		if w.CampaignID == nil {
			var user model.User
			if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&user, "id = ?", w.UserID).Error; err != nil {
				return fmt.Errorf("failed to lock user: %w", err)
			}
			if user.BonusBalance < w.Amount {
				return errors.New("saldo komisi tidak mencukupi untuk pencairan ini")
			}
			if err := tx.Model(&user).UpdateColumns(map[string]interface{}{
				"bonus_balance":   gorm.Expr("bonus_balance - ?", w.Amount),
				"bonus_withdrawn": gorm.Expr("bonus_withdrawn + ?", w.Amount),
			}).Error; err != nil {
				return err
			}
			now := time.Now()
			w.Status = "Selesai"
			w.CompletedAt = &now
			return tx.Save(&w).Error
		}

		var campaign model.Campaign
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&campaign, "id = ?", *w.CampaignID).Error; err != nil {
			return fmt.Errorf("failed to lock campaign: %w", err)
		}
		if campaign.TotalRaised < w.Amount {
			return errors.New("insufficient campaign balance to complete withdrawal")
		}

		// 1. Deduct campaign balance.
		campaign.TotalRaised -= w.Amount
		if err := tx.Save(&campaign).Error; err != nil {
			return err
		}

		// 2. Deduct foundation global balance.
		var settings model.Setting
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&settings).Error; err != nil {
			return err
		}
		// Guard the foundation balance the same way the campaign balance is guarded
		// above: never let an approval drive TotalMoney negative (e.g. if a payout was
		// queued against a since-corrected balance). Without this the org's running
		// global balance could silently go negative and poison every later report.
		if settings.TotalMoney < w.Amount {
			return errors.New("saldo yayasan tidak mencukupi untuk pencairan ini")
		}
		settings.TotalMoney -= w.Amount
		if err := tx.Save(&settings).Error; err != nil {
			return err
		}

		now := time.Now()

		// 3. Campaign cash-out mutation.
		fundOut := model.CampaignFund{
			CampaignID:  *w.CampaignID,
			AmountOut:   w.Amount,
			Description: fmt.Sprintf("Pencairan dana disetujui ke rekening %s (%s)", w.BankName, w.BankNumber),
			Month:       int(now.Month()),
			Year:        now.Year(),
			Balance:     campaign.TotalRaised,
		}
		if err := tx.Create(&fundOut).Error; err != nil {
			return err
		}

		// 4. Foundation cash-out report.
		reportAmount := w.Amount
		report := model.FinancialReport{
			Description: fmt.Sprintf("Pencairan Program: %s ke %s", campaign.Title, w.BankName),
			AmountOut:   &reportAmount,
			Month:       int(now.Month()),
			Year:        now.Year(),
			Balance:     settings.TotalMoney,
		}
		if err := tx.Create(&report).Error; err != nil {
			return err
		}

		w.Status = "Selesai"
		w.CompletedAt = &now
		return tx.Save(&w).Error
	})
}

func (s *WithdrawalService) Reject(id uuid.UUID) error {
	w, err := s.withdrawalRepo.FindByID(id)
	if err != nil {
		return errors.New("withdrawal not found")
	}
	if w.Status == "Selesai" {
		return errors.New("cannot reject completed withdrawal")
	}
	w.Status = "Ditolak"
	return s.withdrawalRepo.Update(w)
}
