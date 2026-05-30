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
	var campaign model.Campaign
	if err := s.db.First(&campaign, "id = ? AND user_id = ?", req.CampaignID, userID).Error; err != nil {
		return nil, errors.New("campaign not found or access denied")
	}

	// Withdrawable = total raised - (completed + queued withdrawals).
	var totalWithdrawn int64
	s.db.Model(&model.Withdrawal{}).
		Where("campaign_id = ? AND status IN ?", req.CampaignID, []string{"Selesai", "Dalam Antrian", "Menunggu"}).
		Select("COALESCE(SUM(amount), 0)").Scan(&totalWithdrawn)

	availableBalance := campaign.TotalRaised - totalWithdrawn
	if req.Amount > availableBalance {
		return nil, fmt.Errorf("dana tidak mencukupi, sisa saldo yang dapat ditarik: Rp %d", availableBalance)
	}

	now := time.Now()
	w := model.Withdrawal{
		UserID:      userID,
		CampaignID:  &req.CampaignID,
		BankType:    req.BankType,
		BankNumber:  req.BankNumber,
		BankName:    req.BankName,
		Amount:      req.Amount,
		Status:      "Dalam Antrian",
		RequestedAt: &now,
	}
	if err := s.db.Create(&w).Error; err != nil {
		return nil, err
	}
	return &w, nil
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
		if w.CampaignID == nil {
			return errors.New("withdrawal has no associated campaign")
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
