package service

import (
	"github.com/anrdart/niatbaik-api/internal/repository"
)

type AnalyticsService struct {
	statsRepo     *repository.StatsRepo
	adCostRepo    *repository.AdCostRepo
	pageVisitRepo *repository.PageVisitRepo
}

func NewAnalyticsService(statsRepo *repository.StatsRepo, adCostRepo *repository.AdCostRepo, pageVisitRepo *repository.PageVisitRepo) *AnalyticsService {
	return &AnalyticsService{statsRepo: statsRepo, adCostRepo: adCostRepo, pageVisitRepo: pageVisitRepo}
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
	// Ad-spend-derived KPIs the Advertiser/Analytics dashboards render. total_visitors
	// uses the same leads*3 estimate as the funnel until real session tracking exists;
	// when there is no recorded ad spend, cost_per_lead/cost_per_donation/roas are 0.
	TotalVisitors    int64   `json:"total_visitors"`
	TotalAdSpend     int64   `json:"total_ad_spend"`
	CostPerLead      float64 `json:"cost_per_lead"`
	CostPerDonation  float64 `json:"cost_per_donation"`
	ROAS             float64 `json:"roas"`
}

func (s *AnalyticsService) GetOverview() (*AnalyticsOverview, error) {
	stats, err := s.statsRepo.GetDashboardStats()
	if err != nil {
		return nil, err
	}

	// Sum recorded ad spend across all platforms (best-effort; empty => 0 KPIs).
	var totalSpend int64
	if s.adCostRepo != nil {
		if totals, err := s.adCostRepo.GetTotalByPlatform(); err == nil {
			for _, t := range totals {
				totalSpend += t.Total
			}
		}
	}

	// Real page visits when the beacon has recorded any; fall back to the legacy
	// leads*3 estimate only while no visits exist yet (fresh deploy).
	visitors := stats.TotalLeads * 3
	if s.pageVisitRepo != nil {
		if v, err := s.pageVisitRepo.TotalVisits(); err == nil && v > 0 {
			visitors = v
		}
	}
	ov := &AnalyticsOverview{
		TotalRaised:       stats.TotalRaised,
		TotalTransactions: stats.TotalTransactions,
		TotalLeads:        stats.TotalLeads,
		ConversionRate:    stats.ConversionRate,
		ActiveCampaigns:   stats.ActiveCampaigns,
		TotalFundraisers:  stats.TotalFundraisers,
		TodayRaised:       stats.TodayRaised,
		MonthRaised:       stats.MonthRaised,
		TotalVisitors:     visitors,
		TotalAdSpend:      totalSpend,
	}
	if totalSpend > 0 {
		if stats.TotalLeads > 0 {
			ov.CostPerLead = float64(totalSpend) / float64(stats.TotalLeads)
		}
		if stats.TotalTransactions > 0 {
			ov.CostPerDonation = float64(totalSpend) / float64(stats.TotalTransactions)
		}
		ov.ROAS = float64(stats.TotalRaised) / float64(totalSpend)
	}
	return ov, nil
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

type FunnelStage struct {
	Stage string  `json:"stage"`
	Count int64   `json:"count"`
	Rate  float64 `json:"rate"`
}

func (s *AnalyticsService) GetFunnelData() ([]FunnelStage, error) {
	stats, err := s.statsRepo.GetDashboardStats()
	if err != nil {
		return nil, err
	}

	visitors := stats.TotalLeads * 3
	if visitors == 0 {
		visitors = 1
	}

	// Stages: visit (estimated) -> lead (any invoice created) -> paid (settled).
	// "donation" == invoice created (TotalLeads counts all invoices), "paid" ==
	// settled (TotalTransactions counts is_paid). Distinct counts so the funnel
	// shows the real drop-off between created and paid instead of two equal bars.
	funnel := []FunnelStage{
		{Stage: "visit", Count: visitors, Rate: 100},
		{Stage: "lead", Count: stats.TotalLeads, Rate: float64(stats.TotalLeads) / float64(visitors) * 100},
		{Stage: "donation", Count: stats.TotalLeads, Rate: float64(stats.TotalLeads) / float64(visitors) * 100},
		{Stage: "paid", Count: stats.TotalTransactions, Rate: float64(stats.TotalTransactions) / float64(visitors) * 100},
	}
	return funnel, nil
}
