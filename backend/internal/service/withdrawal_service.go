package service

import (
	"errors"
	"time"

	"github.com/anrdart/niatbaik-api/internal/repository"
	"github.com/google/uuid"
)

type WithdrawalService struct {
	withdrawalRepo *repository.WithdrawalRepo
}

func NewWithdrawalService(withdrawalRepo *repository.WithdrawalRepo) *WithdrawalService {
	return &WithdrawalService{withdrawalRepo: withdrawalRepo}
}

func (s *WithdrawalService) Approve(id uuid.UUID) error {
	w, err := s.withdrawalRepo.FindByID(id)
	if err != nil {
		return errors.New("withdrawal not found")
	}

	if w.Status == "Selesai" {
		return errors.New("withdrawal already completed")
	}

	now := time.Now()
	w.Status = "Selesai"
	w.CompletedAt = &now

	return s.withdrawalRepo.Update(w)
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
