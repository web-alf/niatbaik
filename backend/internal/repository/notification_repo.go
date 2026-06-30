package repository

import (
	"time"

	"github.com/anrdart/niatbaik-api/internal/model"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type NotificationRepo struct {
	db *gorm.DB
}

func NewNotificationRepo(db *gorm.DB) *NotificationRepo {
	return &NotificationRepo{db: db}
}

// readBroadcastIDs returns the set of broadcast-notification ids this user has read
// (from notification_reads). Owned notifications track read-state on the row itself.
func (r *NotificationRepo) readBroadcastIDs(userID uuid.UUID) (map[uuid.UUID]bool, error) {
	var ids []uuid.UUID
	err := r.db.Model(&model.NotificationRead{}).
		Where("user_id = ?", userID).
		Pluck("notification_id", &ids).Error
	if err != nil {
		return nil, err
	}
	set := make(map[uuid.UUID]bool, len(ids))
	for _, id := range ids {
		set[id] = true
	}
	return set, nil
}

// applyPerUserRead patches IsRead on broadcast rows from the per-user reads table, so
// a broadcast read by THIS user shows as read without affecting any other user.
func (r *NotificationRepo) applyPerUserRead(notifs []model.Notification, userID uuid.UUID) error {
	read, err := r.readBroadcastIDs(userID)
	if err != nil {
		return err
	}
	for i := range notifs {
		if notifs[i].UserID == nil && read[notifs[i].ID] {
			notifs[i].IsRead = true
		}
	}
	return nil
}

func (r *NotificationRepo) FindByUser(userID uuid.UUID, limit int) ([]model.Notification, error) {
	var notifications []model.Notification
	query := r.db.Where("user_id = ? OR user_id IS NULL", userID).
		Order("created_at desc")
	if limit > 0 {
		query = query.Limit(limit)
	}
	if err := query.Find(&notifications).Error; err != nil {
		return nil, err
	}
	if err := r.applyPerUserRead(notifications, userID); err != nil {
		return nil, err
	}
	return notifications, nil
}

// FindUnread returns the user's unread notifications and an accurate unread count:
// owned rows with is_read=false, plus broadcast rows this user has NOT read.
func (r *NotificationRepo) FindUnread(userID uuid.UUID) ([]model.Notification, int64, error) {
	var all []model.Notification
	if err := r.db.Where("user_id = ? OR user_id IS NULL", userID).
		Order("created_at desc").Find(&all).Error; err != nil {
		return nil, 0, err
	}
	if err := r.applyPerUserRead(all, userID); err != nil {
		return nil, 0, err
	}
	unread := all[:0]
	for _, n := range all {
		if !n.IsRead {
			unread = append(unread, n)
		}
	}
	return unread, int64(len(unread)), nil
}

func (r *NotificationRepo) Create(notification *model.Notification) error {
	return r.db.Create(notification).Error
}

// MarkRead marks one notification read for THIS user. Owned rows flip is_read on the
// row; broadcast rows (user_id IS NULL) get a per-user notification_reads entry so the
// shared row is never mutated. The user_id match on owned rows prevents IDOR.
func (r *NotificationRepo) MarkRead(id, userID uuid.UUID) error {
	var n model.Notification
	if err := r.db.First(&n, "id = ?", id).Error; err != nil {
		return err
	}
	if n.UserID != nil {
		if *n.UserID != userID {
			return nil // not this user's notification — ignore (no IDOR, no error leak)
		}
		return r.db.Model(&model.Notification{}).Where("id = ?", id).Update("is_read", true).Error
	}
	// Broadcast: upsert a per-user read marker (idempotent on the unique index).
	read := model.NotificationRead{NotificationID: id, UserID: userID, ReadAt: time.Now()}
	return r.db.Clauses(clause.OnConflict{DoNothing: true}).Create(&read).Error
}

// MarkAllRead marks every notification visible to this user as read: owned unread rows
// flip is_read; every broadcast the user hasn't read yet gets a notification_reads row.
func (r *NotificationRepo) MarkAllRead(userID uuid.UUID) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		// Owned rows.
		if err := tx.Model(&model.Notification{}).
			Where("user_id = ? AND is_read = false", userID).
			Update("is_read", true).Error; err != nil {
			return err
		}
		// Broadcast rows not yet read by this user.
		var broadcastIDs []uuid.UUID
		if err := tx.Model(&model.Notification{}).
			Where("user_id IS NULL").
			Pluck("id", &broadcastIDs).Error; err != nil {
			return err
		}
		if len(broadcastIDs) == 0 {
			return nil
		}
		now := time.Now()
		reads := make([]model.NotificationRead, 0, len(broadcastIDs))
		for _, id := range broadcastIDs {
			reads = append(reads, model.NotificationRead{NotificationID: id, UserID: userID, ReadAt: now})
		}
		return tx.Clauses(clause.OnConflict{DoNothing: true}).Create(&reads).Error
	})
}
