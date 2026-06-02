package repository

import (
	"github.com/anrdart/niatbaik-api/internal/dto/response"
	"gorm.io/gorm"
)

type DataStudioRepo struct {
	db *gorm.DB
}

func NewDataStudioRepo(db *gorm.DB) *DataStudioRepo {
	return &DataStudioRepo{db: db}
}

// GetOverview aggregates headline metrics, a daily time-series, and a source
// breakdown from the invoices + ad_costs tables.
func (r *DataStudioRepo) GetOverview() (*response.DSOverview, error) {
	ov := &response.DSOverview{}

	r.db.Table("invoices").Where("is_paid = ?", true).
		Select("COALESCE(SUM(total),0)").Scan(&ov.Scorecard.Revenue)
	r.db.Table("invoices").Where("is_paid = ?", true).Count(&ov.Scorecard.Donations)
	r.db.Table("invoices").Count(&ov.Scorecard.Sessions)
	r.db.Table("invoices").Where("is_paid = ? AND donor_email <> ''", true).
		Distinct("donor_email").Count(&ov.Scorecard.Donors)

	if ov.Scorecard.Sessions > 0 {
		ov.Scorecard.CVR = float64(ov.Scorecard.Donations) / float64(ov.Scorecard.Sessions) * 100
	}

	var spend int64
	r.db.Table("ad_costs").Select("COALESCE(SUM(amount),0)").Scan(&spend)
	if spend > 0 {
		ov.Scorecard.ROAS = float64(ov.Scorecard.Revenue) / float64(spend)
	}

	r.db.Table("invoices").
		Select("TO_CHAR(paid_at,'YYYY-MM-DD') as date, COUNT(*) as donations, COALESCE(SUM(total),0) as revenue").
		Where("is_paid = ? AND paid_at IS NOT NULL", true).
		Group("TO_CHAR(paid_at,'YYYY-MM-DD')").
		Order("date asc").
		Scan(&ov.Series)

	r.db.Table("invoices").
		Select("utm_source as source, COUNT(*) as sessions, COALESCE(SUM(CASE WHEN is_paid THEN total ELSE 0 END),0) as revenue").
		Where("utm_source <> ''").
		Group("utm_source").
		Order("sessions desc").
		Scan(&ov.Sources)

	return ov, nil
}

// GetFunnel returns the conversion funnel steps from sessions → paid.
func (r *DataStudioRepo) GetFunnel() ([]response.DSFunnelStep, error) {
	var sessions, initiated, paid int64
	r.db.Table("invoices").Count(&sessions)
	r.db.Table("invoices").Where("status <> ''").Count(&initiated)
	r.db.Table("invoices").Where("is_paid = ?", true).Count(&paid)
	return []response.DSFunnelStep{
		{Step: "Sessions", Count: sessions},
		{Step: "Initiated Checkout", Count: initiated},
		{Step: "Paid", Count: paid},
	}, nil
}

// GetPlatform aggregates spend + revenue for a single ad platform (utm_source).
func (r *DataStudioRepo) GetPlatform(platform string) (*response.DSPlatform, error) {
	p := &response.DSPlatform{Platform: platform}
	r.db.Table("ad_costs").Where("LOWER(platform) = LOWER(?)", platform).
		Select("COALESCE(SUM(amount),0)").Scan(&p.Spend)
	r.db.Table("invoices").Where("LOWER(utm_source) = LOWER(?)", platform).Count(&p.Sessions)
	r.db.Table("invoices").Where("LOWER(utm_source) = LOWER(?) AND is_paid = ?", platform, true).Count(&p.Donations)
	r.db.Table("invoices").Where("LOWER(utm_source) = LOWER(?) AND is_paid = ?", platform, true).
		Select("COALESCE(SUM(total),0)").Scan(&p.Revenue)
	if p.Spend > 0 {
		p.ROAS = float64(p.Revenue) / float64(p.Spend)
	}
	return p, nil
}

// GetGeo returns donations grouped by province (empty if no province data).
func (r *DataStudioRepo) GetGeo() ([]response.DSGeoEntry, error) {
	var out []response.DSGeoEntry
	// Provinces are not tracked on invoices in the current schema; return empty
	// so the frontend seed-fills the geo visualization.
	return out, nil
}
