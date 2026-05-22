package service

import (
	"github.com/anrdart/niatbaik-api/internal/repository"
)

type AnalyticsService struct {
	statsRepo *repository.StatsRepo
}

func NewAnalyticsService(statsRepo *repository.StatsRepo) *AnalyticsService {
	return &AnalyticsService{statsRepo: statsRepo}
}

type AnalyticsOverview struct {
	TotalRaised       int64   `json:"total_raised"`
	TotalTransactions int64   `json:"total_transactions"`
	TotalLeads        int64   `json:"total_leads"`
	ConversionRate    float64 `json:"conversion_rate"`
	ActiveCampaigns   int64   `json:"active_campaigns"`
	TotalFundraisers  int64   `json:"total_fundraisers"`
	TodayRaised       int64   `json:"today_raised"`
	MonthRaised       int64   `json:"month_raised"`
}

func (s *AnalyticsService) GetOverview() (*AnalyticsOverview, error) {
	stats, err := s.statsRepo.GetDashboardStats()
	if err != nil {
		return nil, err
	}

	return &AnalyticsOverview{
		TotalRaised:       stats.TotalRaised,
		TotalTransactions: stats.TotalTransactions,
		TotalLeads:        stats.TotalLeads,
		ConversionRate:    stats.ConversionRate,
		ActiveCampaigns:   stats.ActiveCampaigns,
		TotalFundraisers:  stats.TotalFundraisers,
		TodayRaised:       stats.TodayRaised,
		MonthRaised:       stats.MonthRaised,
	}, nil
}

func (s *AnalyticsService) GetCampaignPerformance() ([]repository.CampaignPerf, error) {
	return s.statsRepo.GetCampaignPerformance()
}

func (s *AnalyticsService) GetUTMData() ([]repository.UTMEntry, error) {
	return s.statsRepo.GetUTMTracking()
}

func (s *AnalyticsService) GetTrafficBreakdown() ([]repository.TrafficSource, error) {
	return s.statsRepo.GetTrafficSources()
}
