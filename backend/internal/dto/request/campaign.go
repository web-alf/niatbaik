package request

import "github.com/google/uuid"

type CreateCampaignRequest struct {
	Title            string     `json:"title" validate:"required,max=200"`
	ShortDescription string     `json:"short_description" validate:"required,max=500"`
	Description      string     `json:"description" validate:"required"`
	Target           *int64     `json:"target"`
	DurationDays     *int       `json:"duration_days"`
	CategoryID       *uuid.UUID `json:"category_id"`
	Unlimited        bool       `json:"unlimited"`
	Featured         bool       `json:"featured"`
	LocationName     string     `json:"location_name"`
	LocationGmaps    string     `json:"location_gmaps"`
	FormType         string     `json:"form_type"`
	Status           string     `json:"status"`
}

type UpdateCampaignRequest struct {
	Title            string     `json:"title"`
	ShortDescription string     `json:"short_description"`
	Description      string     `json:"description"`
	Target           *int64     `json:"target"`
	DurationDays     *int       `json:"duration_days"`
	CategoryID       *uuid.UUID `json:"category_id"`
	Unlimited        bool       `json:"unlimited"`
	Featured         bool       `json:"featured"`
	Status           string     `json:"status"`
	LocationName     string     `json:"location_name"`
	LocationGmaps    string     `json:"location_gmaps"`
	FormType         string     `json:"form_type"`
}
