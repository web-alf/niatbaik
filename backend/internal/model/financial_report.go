package model

import (
	"time"

	"github.com/google/uuid"
)

type FinancialReport struct {
	ID          uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Description string    `gorm:"type:text" json:"description"`
	AmountIn    *int64    `json:"amount_in"`
	AmountOut   *int64    `json:"amount_out"`
	Month       int       `json:"month"`
	Year        int       `json:"year"`
	Balance     int64     `gorm:"default:0" json:"balance"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}
