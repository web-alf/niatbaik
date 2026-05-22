package model

import (
	"time"

	"github.com/google/uuid"
)

type Category struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Name      string    `gorm:"size:100;not null" json:"name"`
	Slug      string    `gorm:"size:100;uniqueIndex;not null" json:"slug"`
	Image     string    `gorm:"size:255" json:"image"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	Campaigns []Campaign `gorm:"foreignKey:CategoryID" json:"campaigns,omitempty"`
}
