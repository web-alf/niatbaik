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
	Icon             string     `json:"icon"`
	ThumbGradient    string     `json:"thumb_gradient"`
	FormStyle        string     `json:"form_style"`
	WANotification   bool       `json:"wa_notification"`
	FollowupEnabled  bool       `json:"followup_enabled"`
	MetaPixelID      string     `json:"meta_pixel_id" validate:"omitempty,max=100"`
	TikTokPixelID    string     `json:"tiktok_pixel_id" validate:"omitempty,max=100"`
	GTMID            string     `json:"gtm_id" validate:"omitempty,max=100"`
	PopupInfo        bool       `json:"popup_info"`
	WAFlyingButton   bool       `json:"wa_flying_button"`
	ExternalLink     string     `json:"external_link" validate:"omitempty,max=500"`
	MinDonation      int64      `json:"min_donation" validate:"omitempty,min=0"`
	MaxDonation      int64      `json:"max_donation" validate:"omitempty,min=0"`
	OptNominal       string     `json:"opt_nominal"`
	ButtonColor      string     `json:"button_color" validate:"omitempty,max=30"`
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
	Icon             string     `json:"icon"`
	ThumbGradient    string     `json:"thumb_gradient"`
	FormStyle        string     `json:"form_style"`
	WANotification   *bool      `json:"wa_notification"`
	FollowupEnabled  *bool      `json:"followup_enabled"`
	MetaPixelID      string     `json:"meta_pixel_id"`
	TikTokPixelID    string     `json:"tiktok_pixel_id"`
	GTMID            string     `json:"gtm_id"`
	PopupInfo        *bool      `json:"popup_info"`
	WAFlyingButton   *bool      `json:"wa_flying_button"`
	ExternalLink     string     `json:"external_link"`
	MinDonation      *int64     `json:"min_donation"`
	MaxDonation      *int64     `json:"max_donation"`
	OptNominal       string     `json:"opt_nominal"`
	ButtonColor      string     `json:"button_color"`
}
