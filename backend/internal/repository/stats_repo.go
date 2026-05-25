package repository

import (
	"time"

	"github.com/anrdart/niatbaik-api/internal/model"
	"gorm.io/gorm"
)

type StatsRepo struct {
	db *gorm.DB
}

func NewStatsRepo(db *gorm.DB) *StatsRepo {
	return &StatsRepo{db: db}
}

type DashboardStats struct {
	TotalRaised       int64   `json:"total_raised"`
	TotalTransactions int64   `json:"total_transactions"`
	ActiveCampaigns   int64   `json:"active_campaigns"`
	TotalFundraisers  int64   `json:"total_fundraisers"`
	TotalLeads        int64   `json:"total_leads"`
	ConversionRate    float64 `json:"conversion_rate"`
	TodayRaised       int64   `json:"today_raised"`
	MonthRaised       int64   `json:"month_raised"`
}

type DailyDonation struct {
	Date   string `json:"date"`
	Amount int64  `json:"amount"`
	Count  int64  `json:"count"`
}

type PaymentBreakdown struct {
	Method     string  `json:"method"`
	Count      int64   `json:"count"`
	Total      int64   `json:"total"`
	Percentage float64 `json:"percentage"`
}

type TrafficSource struct {
	Source    string `json:"source"`
	Visits   int64  `json:"visits"`
	Leads    int64  `json:"leads"`
	Donations int64 `json:"donations"`
}

type CampaignPerf struct {
	CampaignID   string `json:"campaign_id"`
	Title        string `json:"title"`
	Visitors     int64  `json:"visitors"`
	Leads        int64  `json:"leads"`
	Donations    int64  `json:"donations"`
	Revenue      int64  `json:"revenue"`
}

type UTMEntry struct {
	Source   string `json:"source"`
	Medium   string `json:"medium"`
	Campaign string `json:"campaign"`
	Sessions int64  `json:"sessions"`
}

func (r *StatsRepo) GetDashboardStats() (*DashboardStats, error) {
	stats := &DashboardStats{}

	// total raised from paid invoices
	r.db.Model(&model.Invoice{}).
		Where("is_paid = ?", true).
		Select("COALESCE(SUM(total), 0)").
		Scan(&stats.TotalRaised)

	// total transactions (paid)
	r.db.Model(&model.Invoice{}).
		Where("is_paid = ?", true).
		Count(&stats.TotalTransactions)

	// active campaigns
	r.db.Model(&model.Campaign{}).
		Where("status IN ?", []string{"Berjalan", "Running"}).
		Count(&stats.ActiveCampaigns)

	// fundraisers
	r.db.Model(&model.User{}).
		Where("role = ?", "fundraiser").
		Count(&stats.TotalFundraisers)

	// total leads (all invoices)
	r.db.Model(&model.Invoice{}).Count(&stats.TotalLeads)

	// conversion rate
	if stats.TotalLeads > 0 {
		stats.ConversionRate = float64(stats.TotalTransactions) / float64(stats.TotalLeads) * 100
	}

	// today raised
	now := time.Now()
	todayStart := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	r.db.Model(&model.Invoice{}).
		Where("is_paid = ? AND paid_at >= ?", true, todayStart).
		Select("COALESCE(SUM(total), 0)").
		Scan(&stats.TodayRaised)

	// month raised
	monthStart := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())
	r.db.Model(&model.Invoice{}).
		Where("is_paid = ? AND paid_at >= ?", true, monthStart).
		Select("COALESCE(SUM(total), 0)").
		Scan(&stats.MonthRaised)

	return stats, nil
}

func (r *StatsRepo) GetDailyDonations(days int) ([]DailyDonation, error) {
	var results []DailyDonation
	cutoff := time.Now().AddDate(0, 0, -days)

	err := r.db.Model(&model.Invoice{}).
		Where("is_paid = ? AND paid_at >= ?", true, cutoff).
		Select("TO_CHAR(paid_at, 'YYYY-MM-DD') as date, COALESCE(SUM(total), 0) as amount, COUNT(*) as count").
		Group("TO_CHAR(paid_at, 'YYYY-MM-DD')").
		Order("date asc").
		Scan(&results).Error
	return results, err
}

func (r *StatsRepo) GetPaymentMethodBreakdown() ([]PaymentBreakdown, error) {
	var results []PaymentBreakdown

	err := r.db.Model(&model.Invoice{}).
		Where("is_paid = ?", true).
		Select("payment_method_name as method, COUNT(*) as count, COALESCE(SUM(total), 0) as total").
		Group("payment_method_name").
		Order("total desc").
		Scan(&results).Error
	if err != nil {
		return nil, err
	}

	var grandTotal int64
	for _, r := range results {
		grandTotal += r.Total
	}
	if grandTotal > 0 {
		for i := range results {
			results[i].Percentage = float64(results[i].Total) / float64(grandTotal) * 100
		}
	}

	return results, nil
}

func (r *StatsRepo) GetTrafficSources() ([]TrafficSource, error) {
	var results []TrafficSource

	err := r.db.Model(&model.Invoice{}).
		Where("utm_source != ''").
		Select(`
			utm_source as source,
			COUNT(*) as visits,
			COUNT(*) as leads,
			SUM(CASE WHEN is_paid = true THEN 1 ELSE 0 END) as donations
		`).
		Group("utm_source").
		Order("donations desc").
		Scan(&results).Error
	return results, err
}

func (r *StatsRepo) GetCampaignPerformance() ([]CampaignPerf, error) {
	var results []CampaignPerf

	err := r.db.Model(&model.Campaign{}).
		Select(`
			campaigns.id as campaign_id,
			campaigns.title,
			(SELECT COUNT(*) FROM loves WHERE loves.campaign_id = campaigns.id) as visitors,
			(SELECT COUNT(*) FROM invoices WHERE invoices.campaign_id = campaigns.id) as leads,
			(SELECT COUNT(*) FROM invoices WHERE invoices.campaign_id = campaigns.id AND invoices.is_paid = true) as donations,
			campaigns.total_raised as revenue
		`).
		Where("campaigns.status = ?", "Berjalan").
		Order("revenue desc").
		Scan(&results).Error
	return results, err
}

func (r *StatsRepo) GetUTMTracking() ([]UTMEntry, error) {
	var results []UTMEntry

	err := r.db.Model(&model.Invoice{}).
		Where("utm_source != '' OR utm_medium != '' OR utm_campaign != ''").
		Select("utm_source as source, utm_medium as medium, utm_campaign as campaign, COUNT(*) as sessions").
		Group("utm_source, utm_medium, utm_campaign").
		Order("sessions desc").
		Scan(&results).Error
	return results, err
}

func (r *StatsRepo) GetRecentTransactions(limit int) ([]model.Invoice, error) {
	var invoices []model.Invoice
	err := r.db.Preload("Campaign").Preload("User").
		Where("is_paid = ?", true).
		Order("paid_at desc").
		Limit(limit).
		Find(&invoices).Error
	return invoices, err
}
