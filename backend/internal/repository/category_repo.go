package repository

import (
	"github.com/anrdart/niatbaik-api/internal/model"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type CategoryRepo struct {
	db *gorm.DB
}

func NewCategoryRepo(db *gorm.DB) *CategoryRepo {
	return &CategoryRepo{db: db}
}

func (r *CategoryRepo) FindAll() ([]model.Category, error) {
	var cats []model.Category
	err := r.db.Order("name asc").Find(&cats).Error
	return cats, err
}

func (r *CategoryRepo) FindByID(id uuid.UUID) (*model.Category, error) {
	var c model.Category
	err := r.db.First(&c, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &c, nil
}

func (r *CategoryRepo) FindBySlug(slug string) (*model.Category, error) {
	var c model.Category
	err := r.db.Where("slug = ?", slug).First(&c).Error
	if err != nil {
		return nil, err
	}
	return &c, nil
}

func (r *CategoryRepo) SlugExists(slug string) bool {
	var count int64
	r.db.Model(&model.Category{}).Where("slug = ?", slug).Count(&count)
	return count > 0
}

func (r *CategoryRepo) Create(c *model.Category) error {
	return r.db.Create(c).Error
}

func (r *CategoryRepo) Update(c *model.Category) error {
	return r.db.Save(c).Error
}

func (r *CategoryRepo) Delete(id uuid.UUID) error {
	return r.db.Delete(&model.Category{}, "id = ?", id).Error
}
