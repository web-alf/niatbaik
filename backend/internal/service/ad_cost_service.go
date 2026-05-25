package service

import (
	"time"

	"github.com/anrdart/niatbaik-api/internal/dto/request"
	"github.com/anrdart/niatbaik-api/internal/model"
	"github.com/anrdart/niatbaik-api/internal/repository"
	"github.com/google/uuid"
)

type AdCostService struct {
	repo *repository.AdCostRepo
}

func NewAdCostService(repo *repository.AdCostRepo) *AdCostService {
	return &AdCostService{repo: repo}
}

func (s *AdCostService) Create(req *request.CreateAdCostRequest, userID uuid.UUID) (*model.AdCost, error) {
	date, err := time.Parse("2006-01-02", req.Date)
	if err != nil {
		return nil, err
	}

	cost := &model.AdCost{
		Platform:  req.Platform,
		Amount:    req.Amount,
		Date:      date,
		CreatedBy: userID,
	}
	if err := s.repo.Create(cost); err != nil {
		return nil, err
	}
	return cost, nil
}

func (s *AdCostService) List(platform string, from, to time.Time) ([]model.AdCost, error) {
	return s.repo.FindByDateRange(platform, from, to)
}

func (s *AdCostService) GetTotalByPlatform() ([]repository.PlatformCostTotal, error) {
	return s.repo.GetTotalByPlatform()
}
