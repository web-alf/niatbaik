package repository

import (
	"github.com/anrdart/niatbaik-api/internal/model"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type NotificationRepo struct {
	db *gorm.DB
}

func NewNotificationRepo(db *gorm.DB) *NotificationRepo {
	return &NotificationRepo{db: db}
}

func (r *NotificationRepo) FindByUser(userID uuid.UUID, limit int) ([]model.Notification, error) {
	var notifications []model.Notification
	query := r.db.Where("user_id = ? OR user_id IS NULL", userID).
		Order("created_at desc")
	if limit > 0 {
		query = query.Limit(limit)
	}
	err := query.Find(&notifications).Error
	return notifications, err
}

func (r *NotificationRepo) FindUnread(userID uuid.UUID) ([]model.Notification, int64, error) {
	var notifications []model.Notification
	var count int64

	query := r.db.Where("(user_id = ? OR user_id IS NULL) AND is_read = false", userID)
	if err := query.Model(&model.Notification{}).Count(&count).Error; err != nil {
		return nil, 0, err
	}
	err := query.Order("created_at desc").Find(&notifications).Error
	return notifications, count, err
}

func (r *NotificationRepo) Create(notification *model.Notification) error {
	return r.db.Create(notification).Error
}

// MarkRead flips a single notification to read, scoped to the owner (or a global
// broadcast notification). The user_id guard prevents one user from mutating
// another user's notification state by guessing its UUID (IDOR).
func (r *NotificationRepo) MarkRead(id, userID uuid.UUID) error {
	return r.db.Model(&model.Notification{}).
		Where("id = ? AND (user_id = ? OR user_id IS NULL)", id, userID).
		Update("is_read", true).Error
}

func (r *NotificationRepo) MarkAllRead(userID uuid.UUID) error {
	return r.db.Model(&model.Notification{}).
		Where("(user_id = ? OR user_id IS NULL) AND is_read = false", userID).
		Update("is_read", true).Error
}
