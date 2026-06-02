package response

// DSScorecard holds the headline metrics for the Data Studio overview.
type DSScorecard struct {
	Sessions  int64   `json:"sessions"`
	Donors    int64   `json:"donors"`
	Donations int64   `json:"donations"`
	Revenue   int64   `json:"revenue"`
	ROAS      float64 `json:"roas"`
	CVR       float64 `json:"cvr"`
}

type DSSeriesPoint struct {
	Date      string `json:"date"`
	Sessions  int64  `json:"sessions"`
	Donations int64  `json:"donations"`
	Revenue   int64  `json:"revenue"`
}

type DSSource struct {
	Source   string `json:"source"`
	Sessions int64  `json:"sessions"`
	Revenue  int64  `json:"revenue"`
}

type DSOverview struct {
	Scorecard DSScorecard     `json:"scorecard"`
	Series    []DSSeriesPoint `json:"series"`
	Sources   []DSSource      `json:"sources"`
}

type DSFunnelStep struct {
	Step  string `json:"step"`
	Count int64  `json:"count"`
}

// DSPlatform is a per-platform (Meta/Google/TikTok) metric block, derived from
// ad_costs joined with invoice UTM data.
type DSPlatform struct {
	Platform  string  `json:"platform"`
	Spend     int64   `json:"spend"`
	Sessions  int64   `json:"sessions"`
	Donations int64   `json:"donations"`
	Revenue   int64   `json:"revenue"`
	ROAS      float64 `json:"roas"`
}

type DSGeoEntry struct {
	Region    string `json:"region"`
	Donations int64  `json:"donations"`
	Revenue   int64  `json:"revenue"`
}
