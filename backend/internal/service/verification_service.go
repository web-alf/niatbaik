package service

import (
	"errors"
	"time"

	"github.com/anrdart/niatbaik-api/internal/repository"
	"github.com/google/uuid"
)

type VerificationService struct {
	verificationRepo *repository.VerificationRepo
	userRepo         *repository.UserRepo
}

func NewVerificationService(verificationRepo *repository.VerificationRepo, userRepo *repository.UserRepo) *VerificationService {
	return &VerificationService{
		verificationRepo: verificationRepo,
		userRepo:         userRepo,
	}
}

func (s *VerificationService) Approve(userID uuid.UUID) error {
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return errors.New("user not found")
	}

	detail, err := s.verificationRepo.FindByUserID(userID)
	if err != nil {
		return errors.New("verification detail not found")
	}

	now := time.Now()
	user.VerificationStatus = "verified"
	detail.Status = "approved"
	detail.ReviewedAt = &now

	if err := s.userRepo.Update(user); err != nil {
		return err
	}
	return s.verificationRepo.Update(detail)
}

func (s *VerificationService) Reject(userID uuid.UUID) error {
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return errors.New("user not found")
	}

	detail, err := s.verificationRepo.FindByUserID(userID)
	if err != nil {
		return errors.New("verification detail not found")
	}

	now := time.Now()
	user.VerificationStatus = "unverified"
	detail.Status = "rejected"
	detail.ReviewedAt = &now

	if err := s.userRepo.Update(user); err != nil {
		return err
	}
	return s.verificationRepo.Update(detail)
}
