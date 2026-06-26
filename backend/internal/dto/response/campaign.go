package response

import (
	"math"
	"time"

	"github.com/anrdart/niatbaik-api/internal/model"
	"github.com/google/uuid"
)

type CampaignListItem struct {
	ID                 uuid.UUID `json:"id"`
	Title              string    `json:"title"`
	Slug               string    `json:"slug"`
	ShortDescription   string    `json:"short_description"`
	Image              string    `json:"image"`
	Target             int64     `json:"target"`
	TotalRaised        int64     `json:"total_raised"`
	DonorCount         int64     `json:"donor_count"`
	DaysLeft           int       `json:"days_left"`
	Status             string    `json:"status"`
	Category           string    `json:"category"`
	ProgressPercentage float64   `json:"progress_percentage"`
	Featured           bool      `json:"featured"`
	Icon               string    `json:"icon"`
	ThumbGradient      string    `json:"thumb_gradient"`
	FormStyle          string    `json:"form_style"`
	FormType           string    `json:"form_type"`
	OptNominal         string    `json:"opt_nominal"`
	FormFieldsConfig   string    `json:"form_fields_config"`
	ButtonColor        string    `json:"button_color"`
	MinDonation        int64     `json:"min_donation"`
	MaxDonation        int64     `json:"max_donation"`
	CreatedAt          time.Time `json:"created_at"`
}

type CampaignDetail struct {
	ID                 uuid.UUID            `json:"id"`
	Title              string               `json:"title"`
	Slug               string               `json:"slug"`
	ShortDescription   string               `json:"short_description"`
	Description        string               `json:"description"`
	Image              string               `json:"image"`
	Target             int64                `json:"target"`
	TotalRaised        int64                `json:"total_raised"`
	DonorCount         int64                `json:"donor_count"`
	DaysLeft           int                  `json:"days_left"`
	Status             string               `json:"status"`
	Category           string               `json:"category"`
	ProgressPercentage float64              `json:"progress_percentage"`
	Featured           bool                 `json:"featured"`
	Icon               string               `json:"icon"`
	ThumbGradient      string               `json:"thumb_gradient"`
	FormStyle          string               `json:"form_style"`
	FormType           string               `json:"form_type"`
	OptNominal         string               `json:"opt_nominal"`
	FormFieldsConfig   string               `json:"form_fields_config"`
	// FormItemsConfig is the custom-form item list / zakat calculator (Qurban/Package2/
	// Zakat). Surfaced publicly so the donor form can render the item picker / calculator
	// instead of plain nominal presets. Empty = nominal presets. (Was missing → donor
	// always saw presets even when the admin configured items.)
	FormItemsConfig    string               `json:"form_items_config"`
	// ConversionConfig is the per-campaign "Fire Event" client-fire config (FB/TikTok/
	// Google Adwords conversion IDs + labels + which events fire on submit/success).
	// Non-secret → surfaced publicly so the donor page can load the right pixels and fire
	// the conversion. The CAPI/EAPI secret tokens are NOT here (they stay in pixel_config).
	ConversionConfig   string               `json:"conversion_config"`
	ButtonColor        string               `json:"button_color"`
	MinDonation        int64                `json:"min_donation"`
	MaxDonation        int64                `json:"max_donation"`
	LocationName       string               `json:"location_name"`
	// PaymentConfig is the per-campaign custom payment rows (JSON). Surfaced publicly so
	// the donation form can honor a campaign-level payment override configured in the
	// editor's Advanced → Payment panel. Empty string = use the global/public methods.
	PaymentConfig      string               `json:"payment_config"`
	MetaPixelID        string               `json:"meta_pixel_id"`
	TikTokPixelID      string               `json:"tiktok_pixel_id"`
	GTMID              string               `json:"gtm_id"`
	CreatedAt          time.Time            `json:"created_at"`
	User               CampaignUser         `json:"user"`
	Updates            []CampaignUpdateItem `json:"updates"`
	Donors             []CampaignDonor      `json:"donors"`
}

type CampaignUser struct {
	Name  string `json:"name"`
	Image string `json:"image"`
}

type CampaignDonor struct {
	Name        string    `json:"name"`
	Amount      int64     `json:"amount"`
	IsAnonymous bool      `json:"is_anonymous"`
	CreatedAt   time.Time `json:"created_at"`
}

type CampaignUpdateItem struct {
	Title     string    `json:"title"`
	Body      string    `json:"body"`
	Image     string    `json:"image"`
	CreatedAt time.Time `json:"created_at"`
}

func daysLeft(c *model.Campaign) int {
	if c.PostedAt == nil || c.DurationDays <= 0 {
		return 0
	}
	end := c.PostedAt.AddDate(0, 0, c.DurationDays)
	d := int(math.Ceil(time.Until(end).Hours() / 24))
	if d < 0 {
		return 0
	}
	return d
}

func ToCampaignListItem(c *model.Campaign, donorCount int64) CampaignListItem {
	cat := ""
	if c.Category != nil {
		cat = c.Category.Name
	}
	return CampaignListItem{
		ID:                 c.ID,
		Title:              c.Title,
		Slug:               c.Slug,
		ShortDescription:   c.ShortDescription,
		Image:              c.Image,
		Target:             c.Target,
		TotalRaised:        c.TotalRaised,
		DonorCount:         donorCount,
		DaysLeft:           daysLeft(c),
		Status:             c.Status,
		Category:           cat,
		ProgressPercentage: c.ProgressPercentage(),
		Featured:           c.Featured,
		Icon:               c.Icon,
		ThumbGradient:      c.ThumbGradient,
		FormStyle:          c.FormStyle,
		FormType:           c.FormType,
		OptNominal:         c.OptNominal,
		FormFieldsConfig:   c.FormFieldsConfig,
		ButtonColor:        c.ButtonColor,
		MinDonation:        c.MinDonation,
		MaxDonation:        c.MaxDonation,
		CreatedAt:          c.CreatedAt,
	}
}

func ToCampaignDetail(c *model.Campaign, donorCount int64, donors []CampaignDonor, updates []CampaignUpdateItem) CampaignDetail {
	cat := ""
	if c.Category != nil {
		cat = c.Category.Name
	}
	return CampaignDetail{
		ID:                 c.ID,
		Title:              c.Title,
		Slug:               c.Slug,
		ShortDescription:   c.ShortDescription,
		Description:        c.Description,
		Image:              c.Image,
		Target:             c.Target,
		TotalRaised:        c.TotalRaised,
		DonorCount:         donorCount,
		DaysLeft:           daysLeft(c),
		Status:             c.Status,
		Category:           cat,
		ProgressPercentage: c.ProgressPercentage(),
		Featured:           c.Featured,
		Icon:               c.Icon,
		ThumbGradient:      c.ThumbGradient,
		FormStyle:          c.FormStyle,
		FormType:           c.FormType,
		OptNominal:         c.OptNominal,
		FormFieldsConfig:   c.FormFieldsConfig,
		FormItemsConfig:    c.FormItemsConfig,
		ConversionConfig:   c.ConversionConfig,
		ButtonColor:        c.ButtonColor,
		MinDonation:        c.MinDonation,
		MaxDonation:        c.MaxDonation,
		LocationName:       c.LocationName,
		PaymentConfig:      c.PaymentConfig,
		MetaPixelID:        c.MetaPixelID,
		TikTokPixelID:      c.TikTokPixelID,
		GTMID:              c.GTMID,
		CreatedAt:          c.CreatedAt,
		User: CampaignUser{
			Name:  c.User.Name,
			Image: c.User.Image,
		},
		Updates: updates,
		Donors:  donors,
	}
}
