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
