package repository

import (
	"github.com/anrdart/niatbaik-api/internal/model"
	"github.com/anrdart/niatbaik-api/pkg/pagination"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ArticleRepo struct {
	db *gorm.DB
}

func NewArticleRepo(db *gorm.DB) *ArticleRepo {
	return &ArticleRepo{db: db}
}

// FindAll powers the admin list: every status, optional status/search filters.
// Author + category are preloaded so the table can show them without N+1 lookups.
func (r *ArticleRepo) FindAll(params pagination.PaginationParams, status, search string) ([]model.Article, int64, error) {
	var articles []model.Article
	var total int64

	q := r.db.Model(&model.Article{})
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
		Preload("User").Preload("Category").
		Find(&articles).Error
	return articles, total, err
}

// FindPublished is the public list — Published only, newest published first.
func (r *ArticleRepo) FindPublished(params pagination.PaginationParams, categorySlug, search string) ([]model.Article, int64, error) {
	var articles []model.Article
	var total int64

	q := r.db.Model(&model.Article{}).Where("articles.status = ?", "Published")
	if categorySlug != "" {
		q = q.Joins("JOIN categories ON categories.id = articles.category_id").
			Where("categories.slug = ?", categorySlug)
	}
	if search != "" {
		q = q.Where("articles.title ILIKE ?", "%"+search+"%")
	}
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (params.Page - 1) * params.Limit
	err := q.Offset(offset).Limit(params.Limit).
		Order("published_at desc NULLS LAST, created_at desc").
		Preload("User", publicAuthorOnly).Preload("Category").
		Find(&articles).Error
	return articles, total, err
}

// publicAuthorOnly limits the preloaded author to the byline fields. Without it the
// public endpoints would serialize the full User row (email, phone, …).
func publicAuthorOnly(db *gorm.DB) *gorm.DB {
	return db.Select("id", "name")
}

func (r *ArticleRepo) FindByID(id uuid.UUID) (*model.Article, error) {
	var a model.Article
	err := r.db.Preload("User").Preload("Category").First(&a, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &a, nil
}

// FindPublishedBySlug backs the public detail page — a Draft must 404 publicly even
// if its slug is guessed.
func (r *ArticleRepo) FindPublishedBySlug(slug string) (*model.Article, error) {
	var a model.Article
	err := r.db.Preload("User", publicAuthorOnly).Preload("Category").
		Where("slug = ? AND status = ?", slug, "Published").First(&a).Error
	if err != nil {
		return nil, err
	}
	return &a, nil
}

// SlugExists reports whether the slug is taken, optionally ignoring one row (update).
func (r *ArticleRepo) SlugExists(slug string, excludeID *uuid.UUID) bool {
	q := r.db.Model(&model.Article{}).Where("slug = ?", slug)
	if excludeID != nil {
		q = q.Where("id <> ?", *excludeID)
	}
	var count int64
	q.Count(&count)
	return count > 0
}

func (r *ArticleRepo) Create(a *model.Article) error {
	return r.db.Create(a).Error
}

func (r *ArticleRepo) Update(a *model.Article) error {
	return r.db.Save(a).Error
}

func (r *ArticleRepo) Delete(id uuid.UUID) error {
	return r.db.Delete(&model.Article{}, "id = ?", id).Error
}
