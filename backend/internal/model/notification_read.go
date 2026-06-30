package model

import (
	"time"

	"github.com/google/uuid"
)

// NotificationRead records that a specific user has read a specific notification.
// It exists for BROADCAST notifications (Notification.UserID IS NULL): those are a
// single shared row, so per-user read state can't live on the row itself. Marking a
// broadcast read inserts a row here instead of mutating the shared notification.
// Owned notifications (UserID set) still use Notification.IsRead directly.
type NotificationRead struct {
	ID             uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	NotificationID uuid.UUID `gorm:"type:uuid;not null;uniqueIndex:idx_notif_user" json:"notification_id"`
	UserID         uuid.UUID `gorm:"type:uuid;not null;uniqueIndex:idx_notif_user;index" json:"user_id"`
	ReadAt         time.Time `gorm:"not null" json:"read_at"`

	Notification *Notification `gorm:"foreignKey:NotificationID;constraint:OnDelete:CASCADE" json:"notification,omitempty"`
	User         *User         `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE" json:"user,omitempty"`
}
