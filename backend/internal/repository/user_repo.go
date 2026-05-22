package repository

import (
	"github.com/anrdart/niatbaik-api/internal/model"
	"github.com/anrdart/niatbaik-api/pkg/pagination"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type UserRepo struct {
	db *gorm.DB
}

func NewUserRepo(db *gorm.DB) *UserRepo {
	return &UserRepo{db: db}
}

func (r *UserRepo) FindAll(params pagination.PaginationParams, role, status, search string) ([]model.User, int64, error) {
	var users []model.User
	var total int64

	q := r.db.Model(&model.User{})

	if role != "" {
		q = q.Where("role = ?", role)
	}
	if status != "" {
		q = q.Where("verification_status = ?", status)
	}
	if search != "" {
		q = q.Where("name ILIKE ? OR email ILIKE ?", "%"+search+"%", "%"+search+"%")
	}

	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	err := pagination.ApplyPagination(q, params).Find(&users).Error
	return users, total, err
}

func (r *UserRepo) FindByID(id uuid.UUID) (*model.User, error) {
	var u model.User
	err := r.db.Preload("VerificationDetail").First(&u, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &u, nil
}

func (r *UserRepo) FindByEmail(email string) (*model.User, error) {
	var u model.User
	err := r.db.Where("email = ?", email).First(&u).Error
	if err != nil {
		return nil, err
	}
	return &u, nil
}

func (r *UserRepo) Create(u *model.User) error {
	return r.db.Create(u).Error
}

func (r *UserRepo) Update(u *model.User) error {
	return r.db.Save(u).Error
}

func (r *UserRepo) Delete(id uuid.UUID) error {
	return r.db.Delete(&model.User{}, "id = ?", id).Error
}

func (r *UserRepo) CountByRole() (map[string]int64, error) {
	type result struct {
		Role  string
		Count int64
	}
	var results []result

	err := r.db.Model(&model.User{}).
		Select("role, count(*) as count").
		Group("role").
		Scan(&results).Error
	if err != nil {
		return nil, err
	}

	m := make(map[string]int64)
	for _, r := range results {
		m[r.Role] = r.Count
	}
	return m, nil
}
