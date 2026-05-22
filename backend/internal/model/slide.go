package model

import (
	"time"

	"github.com/google/uuid"
)

type Slide struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Link      string    `gorm:"type:text" json:"link"`
	Image     string    `gorm:"size:255" json:"image"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
