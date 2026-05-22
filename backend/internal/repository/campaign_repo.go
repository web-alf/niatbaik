package repository

import (
	"github.com/anrdart/niatbaik-api/internal/dto/request"
	"github.com/anrdart/niatbaik-api/internal/model"
	"github.com/anrdart/niatbaik-api/pkg/pagination"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type CampaignRepo struct {
	db *gorm.DB
}

func NewCampaignRepo(db *gorm.DB) *CampaignRepo {
	return &CampaignRepo{db: db}
}

// FindAll returns paginated campaigns with filters from PaginationParams.
func (r *CampaignRepo) FindAll(params request.PaginationParams) ([]model.Campaign, int64, error) {
	var campaigns []model.Campaign
	var total int64

	q := r.db.Model(&model.Campaign{}).Preload("Category").Preload("User")

	if params.Status != "" {
		q = q.Where("status = ?", params.Status)
	}
	if params.CategoryID != uuid.Nil {
		q = q.Where("category_id = ?", params.CategoryID)
	}
	if params.Search != "" {
		q = q.Where("title ILIKE ?", "%"+params.Search+"%")
	}

	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (params.Page - 1) * params.Limit
	if err := q.Order(params.Sort).Offset(offset).Limit(params.Limit).Find(&campaigns).Error; err != nil {
		return nil, 0, err
	}

	return campaigns, total, nil
}

// FindAllLegacy uses pkg/pagination params (kept for admin handlers).
func (r *CampaignRepo) FindAllLegacy(params pagination.PaginationParams, status, search string) ([]model.Campaign, int64, error) {
	var campaigns []model.Campaign
	var total int64

	q := r.db.Model(&model.Campaign{})

	if status != "" {
		q = q.Where("status = ?", status)
	}
	if search != "" {
		q = q.Where("title ILIKE ?", "%"+search+"%")
	}

	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	err := pagination.ApplyPagination(q, params).
		Preload("User").
		Preload("Category").
		Find(&campaigns).Error
	return campaigns, total, err
}

func (r *CampaignRepo) FindBySlug(slug string) (*model.Campaign, error) {
	var c model.Campaign
	err := r.db.Preload("Category").Preload("User").Preload("Updates").
		Where("slug = ?", slug).First(&c).Error
	if err != nil {
		return nil, err
	}
	return &c, nil
}

func (r *CampaignRepo) FindByID(id uuid.UUID) (*model.Campaign, error) {
	var c model.Campaign
	err := r.db.Preload("Category").Preload("User").Preload("Updates").Preload("Funds").
		First(&c, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &c, nil
}

func (r *CampaignRepo) FindFeatured(limit int) ([]model.Campaign, error) {
	var campaigns []model.Campaign
	err := r.db.Preload("Category").Preload("User").
		Where("featured = ? AND status = ?", true, "Berjalan").
		Order("created_at desc").Limit(limit).
		Find(&campaigns).Error
	return campaigns, err
}

func (r *CampaignRepo) FindActive(limit int) ([]model.Campaign, error) {
	var campaigns []model.Campaign
	err := r.db.Preload("Category").Preload("User").
		Where("status = ?", "Berjalan").
		Order("created_at desc").Limit(limit).
		Find(&campaigns).Error
	return campaigns, err
}

func (r *CampaignRepo) CountByStatus() (map[string]int64, error) {
	type row struct {
		Status string
		Count  int64
	}
	var rows []row
	if err := r.db.Model(&model.Campaign{}).
		Select("status, count(*) as count").
		Group("status").Find(&rows).Error; err != nil {
		return nil, err
	}
	m := make(map[string]int64)
	for _, r := range rows {
		m[r.Status] = r.Count
	}
	return m, nil
}

func (r *CampaignRepo) SlugExists(slug string) bool {
	var count int64
	r.db.Model(&model.Campaign{}).Where("slug = ?", slug).Count(&count)
	return count > 0
}

func (r *CampaignRepo) Create(c *model.Campaign) error {
	return r.db.Create(c).Error
}

func (r *CampaignRepo) Update(c *model.Campaign) error {
	return r.db.Save(c).Error
}

func (r *CampaignRepo) Delete(id uuid.UUID) error {
	return r.db.Delete(&model.Campaign{}, "id = ?", id).Error
}
