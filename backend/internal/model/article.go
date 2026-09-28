package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Article is standalone editorial content ("Berita") — the admin Berita list/editor and
// the public news page. Distinct from CampaignUpdate, which is a per-campaign timeline
// entry bound to one campaign. Reuses the existing categories table via CategoryID, so
// no other table changes are needed.
type Article struct {
	ID         uuid.UUID  `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	UserID     uuid.UUID  `gorm:"type:uuid;not null;index" json:"user_id"`
	CategoryID *uuid.UUID `gorm:"type:uuid;index" json:"category_id"`
	Title      string     `gorm:"size:255;not null" json:"title"`
	Slug       string     `gorm:"size:255;uniqueIndex;not null" json:"slug"`
	Excerpt    string     `gorm:"size:500" json:"excerpt"`
	Content    string     `gorm:"type:text" json:"content"`
	Image      string     `gorm:"size:255" json:"image"`
	// Status: "Draft" | "Published". Only Published rows are exposed publicly.
	Status string `gorm:"size:20;not null;default:'Draft';index" json:"status"`
	// PublishedAt is stamped the first time the article goes Published and kept on
	// later edits, so the public "tanggal terbit" doesn't jump on every re-save.
	PublishedAt *time.Time `json:"published_at"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
	// Soft delete → Trash (restore/purge via TrashService), same as Campaign.
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	User     User      `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE" json:"user,omitempty"`
	Category *Category `gorm:"foreignKey:CategoryID" json:"category,omitempty"`
}
