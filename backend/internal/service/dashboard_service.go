package service

import (
	"github.com/anrdart/niatbaik-api/internal/model"
	"github.com/anrdart/niatbaik-api/internal/repository"
)

type DashboardService struct {
	statsRepo *repository.StatsRepo
}

func NewDashboardService(statsRepo *repository.StatsRepo) *DashboardService {
	return &DashboardService{statsRepo: statsRepo}
}

func (s *DashboardService) GetStats(role string) (interface{}, error) {
	stats, err := s.statsRepo.GetDashboardStats()
	if err != nil {
		return nil, err
	}

	// CS and advertiser get limited stats
	if role == "cs" {
		return map[string]interface{}{
			"total_transactions": stats.TotalTransactions,
			"total_leads":        stats.TotalLeads,
			"today_raised":       stats.TodayRaised,
		}, nil
	}

	return stats, nil
}

func (s *DashboardService) GetDailyChart(days int) ([]repository.DailyDonation, error) {
	if days < 1 {
		days = 30
	}
	return s.statsRepo.GetDailyDonations(days)
}

func (s *DashboardService) GetPaymentMethodChart() ([]repository.PaymentBreakdown, error) {
	return s.statsRepo.GetPaymentMethodBreakdown()
}

func (s *DashboardService) GetTrafficSourceChart() ([]repository.TrafficSource, error) {
	return s.statsRepo.GetTrafficSources()
}

func (s *DashboardService) GetRecentTransactions(limit int) ([]model.Invoice, error) {
	if limit < 1 {
		limit = 10
	}
	return s.statsRepo.GetRecentTransactions(limit)
}
