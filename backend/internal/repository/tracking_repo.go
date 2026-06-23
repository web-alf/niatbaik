package repository

import (
	"time"

	"github.com/anrdart/niatbaik-api/internal/model"
	"gorm.io/gorm"
)

type TrackingRepo struct {
	db *gorm.DB
}

func NewTrackingRepo(db *gorm.DB) *TrackingRepo {
	return &TrackingRepo{db: db}
}

// LogDispatch persists one dispatch attempt. Best-effort: errors are ignored (logging
// must never affect payment flow). The caller's dispatch logic records success/failure
// into the row before calling this.
func (r *TrackingRepo) LogDispatch(log *model.TrackingDispatchLog) {
	if log == nil {
		return
	}
	if err := r.db.Create(log).Error; err != nil {
		// best-effort; do not propagate — tracking must never break payment confirmation
		_ = err
	}
}

// LastPerPlatform returns the most recent dispatch log per platform ("meta", "tiktok").
// Uses DISTINCT ON, a Postgres feature. Drives the dashboard "last event" status.
func (r *TrackingRepo) LastPerPlatform() (map[string]model.TrackingDispatchLog, error) {
	var rows []model.TrackingDispatchLog
	err := r.db.Raw(`
		SELECT DISTINCT ON (platform) *
		FROM tracking_dispatch_logs
		ORDER BY platform, created_at DESC
	`).Scan(&rows).Error
	if err != nil {
		return nil, err
	}
	out := make(map[string]model.TrackingDispatchLog, len(rows))
	for _, row := range rows {
		out[row.Platform] = row
	}
	return out, nil
}

// CountByPlatform24h returns the count of SUCCESSFUL dispatches per platform in the
// last 24 hours — feeds the "Conversion Events (24h)" panel on the Advertiser dashboard.
func (r *TrackingRepo) CountByPlatform24h() (map[string]int64, error) {
	type row struct {
		Platform string
		Count    int64
	}
	var rows []row
	err := r.db.Table("tracking_dispatch_logs").
		Select("platform, COUNT(*)").
		Where("success = ? AND created_at >= ?", true, time.Now().Add(-24*time.Hour)).
		Group("platform").
		Scan(&rows).Error
	if err != nil {
		return nil, err
	}
	out := make(map[string]int64, len(rows))
	for _, r := range rows {
		out[r.Platform] = r.Count
	}
	return out, nil
}
