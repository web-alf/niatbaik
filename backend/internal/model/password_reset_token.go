package model

import "time"

type PasswordResetToken struct {
	Email     string    `gorm:"size:255;primaryKey" json:"email"`
	Token     string    `gorm:"size:255;not null" json:"token"`
	CreatedAt time.Time `json:"created_at"`
}
