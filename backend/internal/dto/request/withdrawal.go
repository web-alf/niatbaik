package request

import "github.com/google/uuid"

type CreateWithdrawalRequest struct {
	// CampaignID present → campaign-owner payout (from campaign balance). Absent → a
	// fundraiser bonus/commission payout (from the user's bonus_balance).
	CampaignID *uuid.UUID `json:"campaign_id"`
	BankType   string     `json:"bank_type" validate:"required"`
	BankNumber string     `json:"bank_number" validate:"required"`
	BankName   string     `json:"bank_name" validate:"required"`
	Amount     int64      `json:"amount" validate:"required,min=10000"`
}
