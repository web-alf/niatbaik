package repository

import (
	"github.com/anrdart/niatbaik-api/internal/dto/request"
	"github.com/anrdart/niatbaik-api/internal/model"
	"github.com/anrdart/niatbaik-api/pkg/pagination"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
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
	if err := q.Order(pagination.SanitizeSort(params.Sort)).Offset(offset).Limit(params.Limit).Find(&campaigns).Error; err != nil {
		return nil, 0, err
	}

	return campaigns, total, nil
}

// donatableStatuses is the single source of truth for which campaign statuses are both
// publicly visible AND accept donations. It must stay in lockstep with the active-status
// check in donation_service.CreateDonation. A campaign with any other status (Draft,
// Pending, Menunggu, Selesai, Ditolak, …) is hidden from the public list so a donor can
// never open a campaign whose donation would be rejected with a generic error.
var donatableStatuses = []string{"Berjalan", "Running", "Published"}

// FindAllLive returns only publicly-donatable campaigns (status IN donatableStatuses),
// with correct total/pagination. Used by the public campaign list.
func (r *CampaignRepo) FindAllLive(params request.PaginationParams) ([]model.Campaign, int64, error) {
	var campaigns []model.Campaign
	var total int64

	q := r.db.Model(&model.Campaign{}).Preload("Category").Preload("User").
		Where("status IN ?", donatableStatuses)

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
	if err := q.Order(pagination.SanitizeSort(params.Sort)).Offset(offset).Limit(params.Limit).Find(&campaigns).Error; err != nil {
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

// FindBySlugOrID resolves a campaign by its slug OR its UUID id. The public detail
// route is hit by both the Long URL (/c/<slug>) and the Short URL (/c/<uuid>), so
// the lookup must accept either — looking up a UUID by the slug column always 404'd.
func (r *CampaignRepo) FindBySlugOrID(key string) (*model.Campaign, error) {
	var c model.Campaign
	// Fundraisers (+their User) feed the public "Fundraiser" section on the detail page.
	q := r.db.Preload("Category").Preload("User").Preload("Updates").Preload("Fundraisers.User")
	if id, err := uuid.Parse(key); err == nil {
		err = q.Where("id = ? OR slug = ?", id, key).First(&c).Error
		if err != nil {
			return nil, err
		}
		return &c, nil
	}
	if err := q.Where("slug = ?", key).First(&c).Error; err != nil {
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
		Where("featured = ? AND status IN ?", true, []string{"Berjalan", "Running", "Published"}).
		Order("created_at desc").Limit(limit).
		Find(&campaigns).Error
	return campaigns, err
}

func (r *CampaignRepo) FindActive(limit int) ([]model.Campaign, error) {
	var campaigns []model.Campaign
	err := r.db.Preload("Category").Preload("User").
		Where("status IN ?", []string{"Berjalan", "Running"}).
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
	// Unscoped: the slug unique index is plain (no deleted_at predicate), so a
	// soft-deleted campaign still reserves its slug in the DB. Counting only live rows
	// would report the slug free, then the INSERT collides with the index and surfaces
	// an opaque 500. Include soft-deleted rows so the slug generator bumps the suffix.
	r.db.Unscoped().Model(&model.Campaign{}).Where("slug = ?", slug).Count(&count)
	return count > 0
}

// SlugExistsExceptID reports whether ANY campaign (incl. soft-deleted, per the plain
// unique index) other than the given id holds this slug. Used by the update path so a
// campaign keeps its own slug while still avoiding collisions with dead rows.
func (r *CampaignRepo) SlugExistsExceptID(slug string, id uuid.UUID) bool {
	var count int64
	r.db.Unscoped().Model(&model.Campaign{}).Where("slug = ? AND id <> ?", slug, id).Count(&count)
	return count > 0
}

func (r *CampaignRepo) Create(c *model.Campaign) error {
	return r.db.Create(c).Error
}

func (r *CampaignRepo) Update(c *model.Campaign) error {
	// Omit associations on Save. The service loads the campaign with Preload("Category")
	// /Preload("User"), so c.Category holds the OLD related row. GORM's default Save
	// upserts BelongsTo associations and back-fills CategoryID from that stale
	// c.Category.ID — silently reverting a category change. Omitting associations
	// persists only the campaign's own columns (incl. the new CategoryID/UserID the
	// service set) and never touches the categories/users tables.
	return r.db.Omit(clause.Associations).Save(c).Error
}

func (r *CampaignRepo) Delete(id uuid.UUID) error {
	return r.db.Delete(&model.Campaign{}, "id = ?", id).Error
}
