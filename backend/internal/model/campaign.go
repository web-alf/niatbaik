package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Campaign struct {
	ID               uuid.UUID      `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	UserID           uuid.UUID      `gorm:"type:uuid;not null;index" json:"user_id"`
	CategoryID       *uuid.UUID     `gorm:"type:uuid;index" json:"category_id"`
	Title            string         `gorm:"size:255;not null" json:"title"`
	Slug             string         `gorm:"size:255;uniqueIndex;not null" json:"slug"`
	ShortDescription string         `gorm:"size:500" json:"short_description"`
	Description      string         `gorm:"type:text" json:"description"`
	Target           int64          `gorm:"default:0" json:"target"`
	TotalRaised      int64          `gorm:"default:0" json:"total_raised"`
	DurationDays     int            `json:"duration_days"`
	Unlimited        bool           `gorm:"default:false" json:"unlimited"`
	Image            string         `gorm:"size:255" json:"image"`
	Status           string         `gorm:"size:50;default:'Berjalan'" json:"status"`
	Featured         bool           `gorm:"default:false" json:"featured"`
	PostedAt         *time.Time     `json:"posted_at"`
	LastCheckedAt    *time.Time     `json:"last_checked_at"`
	LocationName     string         `gorm:"size:255" json:"location_name"`
	LocationGmaps    string         `gorm:"size:500" json:"location_gmaps"`
	FormType         string         `gorm:"size:50;default:'donasi'" json:"form_type"`
	AllocationTitle  string         `gorm:"size:255" json:"allocation_title"`
	OptNominal       string         `gorm:"type:text" json:"opt_nominal"`          // JSON string
	ButtonColor      string         `gorm:"size:20" json:"button_color"`
	FormFieldsConfig string         `gorm:"type:text" json:"form_fields_config"`   // JSON: button labels, field toggles
	Socialproof      bool           `gorm:"default:false" json:"socialproof"`
	FundraiserSetting bool          `gorm:"default:false" json:"fundraiser_setting"`

	Icon             string  `gorm:"size:50" json:"icon"`
	ThumbGradient    string  `gorm:"size:255" json:"thumb_gradient"`
	FormStyle        string  `gorm:"size:50;default:'Card'" json:"form_style"`
	WANotification   bool    `gorm:"default:false" json:"wa_notification"`
	FollowupEnabled  bool    `gorm:"default:false" json:"followup_enabled"`
	MetaPixelID      string  `gorm:"size:100" json:"meta_pixel_id"`
	TikTokPixelID    string  `gorm:"size:100" json:"tiktok_pixel_id"`
	GTMID            string  `gorm:"size:100" json:"gtm_id"`
	PopupInfo        bool    `gorm:"default:false" json:"popup_info"`
	WAFlyingButton   bool    `gorm:"default:false" json:"wa_flying_button"`
	ExternalLink     string  `gorm:"size:500" json:"external_link"`
	MinDonation      int64   `gorm:"default:0" json:"min_donation"`
	MaxDonation      int64   `gorm:"default:0" json:"max_donation"`
	PaymentConfig    string  `gorm:"type:text" json:"payment_config"` // JSON: per-campaign custom payment rows
	PixelConfig      string  `gorm:"type:text" json:"pixel_config"`   // JSON: Meta CAPI token, test event, event map
	// FormItemsConfig holds the custom-form item list / calculator for the campaign's
	// form_style/form_type: {kind:"qurban|package2|zfitrah|zakat_calc", items:[...], calc:{...}}.
	// Drives the editor's "+ Add Qurban/Package/Zakat" builders and the public item picker.
	// Empty = legacy nominal-preset behavior. Opaque JSON (like payment_config/pixel_config).
	FormItemsConfig  string  `gorm:"type:text" json:"form_items_config"`

	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	// Relationships
	User        User             `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE" json:"user,omitempty"`
	Category    *Category        `gorm:"foreignKey:CategoryID;constraint:OnDelete:SET NULL" json:"category,omitempty"`
	Invoices    []Invoice        `gorm:"foreignKey:CampaignID" json:"invoices,omitempty"`
	Updates     []CampaignUpdate `gorm:"foreignKey:CampaignID" json:"updates,omitempty"`
	Funds       []CampaignFund   `gorm:"foreignKey:CampaignID" json:"funds,omitempty"`
	Fundraisers []Fundraiser     `gorm:"foreignKey:CampaignID" json:"fundraisers,omitempty"`
	Loves       []Love           `gorm:"foreignKey:CampaignID" json:"loves,omitempty"`
}

func (c *Campaign) ProgressPercentage() float64 {
	if c.Target <= 0 {
		return 0
	}
	pct := float64(c.TotalRaised) / float64(c.Target) * 100
	if pct > 100 {
		return 100
	}
	return pct
}
