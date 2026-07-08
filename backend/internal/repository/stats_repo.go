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
	// Period-over-period deltas as percentages (nil = no prior-period baseline, so the UI
	// hides the badge instead of inventing a number). Raised/transactions/leads compare the
	// last 7 days vs the 7 before; today vs yesterday; month vs same day-range last month.
	DeltaRaisedPct   *float64 `json:"delta_raised_pct,omitempty"`
	DeltaTxPct       *float64 `json:"delta_tx_pct,omitempty"`
	DeltaLeadsPct    *float64 `json:"delta_leads_pct,omitempty"`
	DeltaTodayPct    *float64 `json:"delta_today_pct,omitempty"`
	DeltaMonthPct    *float64 `json:"delta_month_pct,omitempty"`
}

// pctDelta returns ((cur-prev)/prev)*100, or nil when prev is 0 (no baseline to compare).
func pctDelta(cur, prev int64) *float64 {
	if prev == 0 {
		return nil
	}
	v := (float64(cur) - float64(prev)) / float64(prev) * 100
	return &v
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
	Name      string `json:"name"` // alias of source; the FE traffic cards key on `name`
	Visits    int64  `json:"visits"`
	Leads     int64  `json:"leads"`
	Donations int64  `json:"donations"`
	Revenue   int64  `json:"revenue"` // settled rupiah attributed to this source
}

type CampaignPerf struct {
	CampaignID string `json:"campaign_id"`
	Title      string `json:"title"`
	Image      string `json:"image"`
	Visitors   int64  `json:"visitors"`
	Leads      int64  `json:"leads"`
	Donations  int64  `json:"donations"`
	Revenue    int64  `json:"revenue"`
}

// CampaignEarning is a per-campaign earnings row for the campaign-earnings report,
// scoped to a date window (donations created within [from,to]). Leads = invoices
// created in the window; Donations/Donors/Revenue = the paid subset of those.
type CampaignEarning struct {
	CampaignID  string `json:"campaign_id"`
	Title       string `json:"title"`
	Slug        string `json:"slug"`
	Image       string `json:"image"`
	Status      string `json:"status"`
	Target      int64  `json:"target"`
	TotalRaised int64  `json:"total_raised"` // all-time, for the progress bar
	Leads       int64  `json:"leads"`
	Donations   int64  `json:"donations"`
	Donors      int64  `json:"donors"`
	Revenue     int64  `json:"revenue"` // settled rupiah within the window
}

type UTMEntry struct {
	Source   string `json:"source"`
	Medium   string `json:"medium"`
	Campaign string `json:"campaign"`
	Content  string `json:"content"`
	Term     string `json:"term"`
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

	// --- Period-over-period deltas (all real, computed from the same invoice table) ---
	sumPaid := func(from, to time.Time) int64 {
		var v int64
		r.db.Model(&model.Invoice{}).
			Where("is_paid = ? AND paid_at >= ? AND paid_at < ?", true, from, to).
			Select("COALESCE(SUM(total), 0)").Scan(&v)
		return v
	}
	countPaid := func(from, to time.Time) int64 {
		var v int64
		r.db.Model(&model.Invoice{}).
			Where("is_paid = ? AND paid_at >= ? AND paid_at < ?", true, from, to).Count(&v)
		return v
	}
	countLeads := func(from, to time.Time) int64 {
		var v int64
		r.db.Model(&model.Invoice{}).
			Where("created_at >= ? AND created_at < ?", from, to).Count(&v)
		return v
	}

	// last 7 days vs the 7 days before that
	wk1Start, wk0Start := now.AddDate(0, 0, -7), now.AddDate(0, 0, -14)
	stats.DeltaRaisedPct = pctDelta(sumPaid(wk1Start, now), sumPaid(wk0Start, wk1Start))
	stats.DeltaTxPct = pctDelta(countPaid(wk1Start, now), countPaid(wk0Start, wk1Start))
	stats.DeltaLeadsPct = pctDelta(countLeads(wk1Start, now), countLeads(wk0Start, wk1Start))

	// today vs yesterday
	yStart := todayStart.AddDate(0, 0, -1)
	stats.DeltaTodayPct = pctDelta(stats.TodayRaised, sumPaid(yStart, todayStart))

	// month-to-date vs the same day-range of the previous month
	lastMonthStart := monthStart.AddDate(0, -1, 0)
	lastMonthSameDay := lastMonthStart.AddDate(0, 0, now.Day()-1)
	stats.DeltaMonthPct = pctDelta(stats.MonthRaised, sumPaid(lastMonthStart, lastMonthSameDay))

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

	// leads = invoices created per source; donations/revenue = the paid subset. visits now
	// come from the REAL page_visits counters (LEFT JOIN by utm_source) instead of the old
	// COUNT(*)-of-invoices proxy; fall back to the lead count only when a source has no
	// recorded visits yet, so the number is never smaller than leads (a lead implies a hit).
	err := r.db.Model(&model.Invoice{}).
		Joins(`LEFT JOIN (
			SELECT utm_source, COALESCE(SUM(count),0) AS v
			FROM page_visits GROUP BY utm_source
		) pv ON pv.utm_source = invoices.utm_source`).
		Where("invoices.utm_source != ''").
		Select(`
			invoices.utm_source as source,
			invoices.utm_source as name,
			GREATEST(COALESCE(MAX(pv.v),0), COUNT(*)) as visits,
			COUNT(*) as leads,
			SUM(CASE WHEN invoices.is_paid = true THEN 1 ELSE 0 END) as donations,
			COALESCE(SUM(CASE WHEN invoices.is_paid = true THEN invoices.total ELSE 0 END), 0) as revenue
		`).
		Group("invoices.utm_source").
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
			campaigns.image,
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

// GetCampaignEarnings returns per-campaign earnings scoped to a date window on the
// invoice's created_at. Leads = invoices created in [from,to]; Donations/Donors/Revenue
// = the paid subset. TotalRaised is all-time (drives the progress bar). Empty from/to
// means all-time. Ordered by windowed revenue desc.
func (r *StatsRepo) GetCampaignEarnings(from, to time.Time) ([]CampaignEarning, error) {
	var results []CampaignEarning

	hasFrom := !from.IsZero()
	hasTo := !to.IsZero()
	// Build the windowed sub-query filter once, reused for leads/donations/donors/revenue.
	win := func(alias string) (string, []interface{}) {
		clause := "invoices.campaign_id = campaigns.id"
		args := []interface{}{}
		if hasFrom {
			clause += " AND invoices.created_at >= ?"
			args = append(args, from)
		}
		if hasTo {
			clause += " AND invoices.created_at <= ?"
			args = append(args, to)
		}
		_ = alias
		return clause, args
	}
	leadWhere, leadArgs := win("l")
	paidWhere, paidArgs := win("p")

	sel := `
		campaigns.id as campaign_id,
		campaigns.title,
		campaigns.slug,
		campaigns.image,
		campaigns.status,
		campaigns.target,
		campaigns.total_raised,
		(SELECT COUNT(*) FROM invoices WHERE ` + leadWhere + `) as leads,
		(SELECT COUNT(*) FROM invoices WHERE ` + paidWhere + ` AND invoices.is_paid = true) as donations,
		(SELECT COUNT(DISTINCT invoices.donor_phone) FROM invoices WHERE ` + paidWhere + ` AND invoices.is_paid = true) as donors,
		(SELECT COALESCE(SUM(invoices.total),0) FROM invoices WHERE ` + paidWhere + ` AND invoices.is_paid = true) as revenue
	`
	// Args order must match the ? placeholders in sel: leads, donations, donors, revenue.
	args := []interface{}{}
	args = append(args, leadArgs...)
	args = append(args, paidArgs...)
	args = append(args, paidArgs...)
	args = append(args, paidArgs...)

	err := r.db.Model(&model.Campaign{}).
		Select(sel, args...).
		Order("revenue desc").
		Scan(&results).Error
	return results, err
}

func (r *StatsRepo) GetUTMTracking() ([]UTMEntry, error) {
	var results []UTMEntry

	err := r.db.Model(&model.Invoice{}).
		Where("utm_source != '' OR utm_medium != '' OR utm_campaign != '' OR utm_content != '' OR utm_term != ''").
		Select("utm_source as source, utm_medium as medium, utm_campaign as campaign, utm_content as content, utm_term as term, COUNT(*) as sessions").
		Group("utm_source, utm_medium, utm_campaign, utm_content, utm_term").
		Order("sessions desc").
		Scan(&results).Error
	return results, err
}

func (r *StatsRepo) GetRecentTransactions(limit int) ([]model.Invoice, error) {
	var invoices []model.Invoice
	// Include leads (unpaid/pending invoices), not only settled ones — a new lead must
	// appear in "Transaksi Terbaru" the moment it comes in. Order by most-recent activity
	// (paid_at when settled, else created_at) so paid + pending interleave chronologically.
	err := r.db.Preload("Campaign").Preload("User").Preload("Referrer").
		Order("COALESCE(paid_at, created_at) desc").
		Limit(limit).
		Find(&invoices).Error
	return invoices, err
}
