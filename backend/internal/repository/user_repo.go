package repository

import (
	"time"

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

func (r *UserRepo) FindAll(params pagination.PaginationParams, role, search string) ([]model.User, int64, error) {
	var users []model.User
	var total int64

	q := r.db.Model(&model.User{})

	if role != "" {
		q = q.Where("role = ?", role)
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
	err := r.db.First(&u, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &u, nil
}

// AuthSnapshot is the per-request authorization state the JWT middleware reads from the
// DB source-of-truth: the live role and the last credential-change time.
type AuthSnapshot struct {
	Role              string
	PasswordChangedAt *time.Time
}

// AuthByID returns the live role + password_changed_at for a user in one query. Used by
// the JWT middleware to (a) authorize against the current role and (b) reject tokens
// issued before the last password change.
func (r *UserRepo) AuthByID(id uuid.UUID) (*AuthSnapshot, error) {
	var u model.User
	if err := r.db.Model(&model.User{}).Select("role", "password_changed_at").First(&u, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &AuthSnapshot{Role: u.Role, PasswordChangedAt: u.PasswordChangedAt}, nil
}

func (r *UserRepo) FindByEmail(email string) (*model.User, error) {
	var u model.User
	err := r.db.Where("email = ?", email).First(&u).Error
	if err != nil {
		return nil, err
	}
	return &u, nil
}

// FindByUsername looks up a user by their referral handle (case-insensitive; usernames are
// stored lowercased so this is an exact match in practice).
func (r *UserRepo) FindByUsername(uname string) (*model.User, error) {
	var u model.User
	err := r.db.Where("username = ?", uname).First(&u).Error
	if err != nil {
		return nil, err
	}
	return &u, nil
}

// UsernameTaken reports whether a username is already in use by any user OTHER than
// excludeID (pass uuid.Nil to check globally). Used for uniqueness validation on
// create/update and by the backfill's collision check.
func (r *UserRepo) UsernameTaken(uname string, excludeID uuid.UUID) bool {
	var count int64
	q := r.db.Model(&model.User{}).Where("username = ?", uname)
	if excludeID != uuid.Nil {
		q = q.Where("id <> ?", excludeID)
	}
	q.Count(&count)
	return count > 0
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
