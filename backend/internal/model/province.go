package model

import "github.com/google/uuid"

type Province struct {
	ID     uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Name   string    `gorm:"size:255;not null" json:"name"`
	Active bool      `gorm:"default:false" json:"active"`
}
