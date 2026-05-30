package request

import "github.com/google/uuid"

type CreateWithdrawalRequest struct {
	CampaignID uuid.UUID `json:"campaign_id" validate:"required"`
	BankType   string    `json:"bank_type" validate:"required"`
	BankNumber string    `json:"bank_number" validate:"required"`
	BankName   string    `json:"bank_name" validate:"required"`
	Amount     int64     `json:"amount" validate:"required,min=10000"`
}
