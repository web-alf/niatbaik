package response

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
	Count  int    `json:"count"`
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
	Spend    int64  `json:"spend"`
}
