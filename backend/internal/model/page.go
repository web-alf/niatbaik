package model

import (
	"time"

	"github.com/google/uuid"
)

type Page struct {
	ID           uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Title        string    `gorm:"size:255;not null" json:"title"`
	Slug         string    `gorm:"size:255;uniqueIndex;not null" json:"slug"`
	Body         string    `gorm:"type:text" json:"body"`
	Image        string    `gorm:"size:255" json:"image"`
	ShowInHeader bool      `gorm:"default:false" json:"show_in_header"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}
