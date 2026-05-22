package response

type AnalyticsOverview struct {
	TotalVisitors      int64   `json:"total_visitors"`
	TotalLeads         int64   `json:"total_leads"`
	TotalDonations     int64   `json:"total_donations"`
	ConversionRate     float64 `json:"conversion_rate"`
	CostPerLead        int64   `json:"cost_per_lead"`
	CostPerDonation    int64   `json:"cost_per_donation"`
	RevenuePerCampaign int64   `json:"revenue_per_campaign"`
	ROAS               float64 `json:"roas"`
}

type CampaignPerformance struct {
	ID        uint    `json:"id"`
	Title     string  `json:"title"`
	Image     string  `json:"image"`
	Visitors  int64   `json:"visitors"`
	Leads     int64   `json:"leads"`
	Donations int64   `json:"donations"`
	CR        float64 `json:"cr"`
	Revenue   int64   `json:"revenue"`
	Spend     int64   `json:"spend"`
	ROAS      string  `json:"roas"`
}

type UTMEntry struct {
	Param    string `json:"param"`
	Value    string `json:"value"`
	Sessions int64  `json:"sessions"`
}
