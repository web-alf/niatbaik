package repository

import (
	"time"

	"github.com/anrdart/niatbaik-api/internal/model"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type PageVisitRepo struct {
	db *gorm.DB
}

func NewPageVisitRepo(db *gorm.DB) *PageVisitRepo {
	return &PageVisitRepo{db: db}
}

// Record increments today's visit counter for a (utm_source) bucket, creating the row on
// first hit. Upsert on the (utm_source, date) unique index so concurrent beacons are
// atomic and rows stay bounded (one per source per day). campaignID is stored for context
// on the first insert; it is not part of the conflict key.
func (r *PageVisitRepo) Record(campaignID *uuid.UUID, utmSource string) error {
	day := time.Now().Format("2006-01-02")
	v := model.PageVisit{CampaignID: campaignID, UTMSource: utmSource, Date: day, Count: 1}
	return r.db.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "utm_source"}, {Name: "date"}},
		DoUpdates: clause.Assignments(map[string]interface{}{"count": gorm.Expr("page_visits.count + 1"), "updated_at": time.Now()}),
	}).Create(&v).Error
}

// VisitsBySource returns total visit counts grouped by utm_source (all time). Used by the
// traffic breakdown to show REAL visits instead of a proxy off paid invoices.
func (r *PageVisitRepo) VisitsBySource() (map[string]int64, error) {
	type row struct {
		UTMSource string
		Total     int64
	}
	var rows []row
	if err := r.db.Model(&model.PageVisit{}).
		Select("utm_source, COALESCE(SUM(count),0) as total").
		Group("utm_source").Scan(&rows).Error; err != nil {
		return nil, err
	}
	m := make(map[string]int64, len(rows))
	for _, x := range rows {
		m[x.UTMSource] = x.Total
	}
	return m, nil
}

// TotalVisits returns the all-time sum of page visits (for the analytics overview
// "visitors" figure — replaces the old TotalLeads*3 fabrication).
func (r *PageVisitRepo) TotalVisits() (int64, error) {
	var total int64
	err := r.db.Model(&model.PageVisit{}).Select("COALESCE(SUM(count),0)").Scan(&total).Error
	return total, err
}
