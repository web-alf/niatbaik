package repository

import (
	"time"

	"github.com/anrdart/niatbaik-api/internal/model"
	"gorm.io/gorm"
)

type AdCostRepo struct {
	db *gorm.DB
}

func NewAdCostRepo(db *gorm.DB) *AdCostRepo {
	return &AdCostRepo{db: db}
}

func (r *AdCostRepo) Create(cost *model.AdCost) error {
	return r.db.Create(cost).Error
}

func (r *AdCostRepo) FindByDateRange(platform string, from, to time.Time) ([]model.AdCost, error) {
	var costs []model.AdCost
	q := r.db.Where("date >= ? AND date <= ?", from, to)
	if platform != "" {
		q = q.Where("platform = ?", platform)
	}
	err := q.Order("date desc").Find(&costs).Error
	return costs, err
}

func (r *AdCostRepo) GetTotalByPlatform() ([]PlatformCostTotal, error) {
	var results []PlatformCostTotal
	err := r.db.Model(&model.AdCost{}).
		Select("platform, COALESCE(SUM(amount), 0) as total").
		Group("platform").
		Scan(&results).Error
	return results, err
}

type PlatformCostTotal struct {
	Platform string `json:"platform"`
	Total    int64  `json:"total"`
}
