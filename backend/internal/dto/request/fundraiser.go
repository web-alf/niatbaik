package request

import "github.com/google/uuid"

// CreateFundraiserRequest invites a fundraiser to a specific campaign. If a user with the
// email already exists it is reused (must be a fundraiser); otherwise a fundraiser user is
// created with the given temp password. The Fundraiser affiliate record ties that user to
// the campaign — a user can be a fundraiser on several campaigns (one record each).
type CreateFundraiserRequest struct {
	Name       string    `json:"name" validate:"required,max=200"`
	Email      string    `json:"email" validate:"required,email"`
	Phone      string    `json:"phone"`
	Password   string    `json:"password" validate:"required,min=6"`
	CampaignID uuid.UUID `json:"campaign_id" validate:"required"`
}
