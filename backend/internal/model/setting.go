package model

import (
	"time"

	"github.com/google/uuid"
)

type Setting struct {
	ID             uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	SiteName       string    `gorm:"size:255" json:"site_name"`
	Logo           string    `gorm:"size:255" json:"logo"`
	Favicon        string    `gorm:"size:255" json:"favicon"`
	PrimaryColor   string    `gorm:"size:20" json:"primary_color"`
	SecondaryColor string    `gorm:"size:20" json:"secondary_color"`
	TotalMoney     int64     `gorm:"default:0" json:"total_money"`
	Email          string    `gorm:"size:255" json:"email"`
	Phone          string    `gorm:"size:20" json:"phone"`
	Address        string    `gorm:"type:text" json:"address"`
	Description    string    `gorm:"type:text" json:"description"`
	FooterCode     string    `gorm:"type:text" json:"footer_code"`
	AutoSlide      int       `gorm:"default:5" json:"auto_slide"`

	// General settings (edited in the admin General panel) — previously sent by the
	// frontend but had no column, so they silently reverted on refresh.
	Domain          string `gorm:"size:255" json:"domain"`
	Timezone        string `gorm:"size:64" json:"timezone"`
	Currency        string `gorm:"size:16" json:"currency"`
	SEOTitle        string `gorm:"size:255" json:"seo_title"`
	SEODescription  string `gorm:"type:text" json:"seo_description"`
	Maintenance     bool   `gorm:"default:false" json:"maintenance"`
	FormPageName    string `gorm:"size:64;default:'donasi'" json:"form_page_name"`
	ThankyouPageName string `gorm:"size:64;default:'invoice'" json:"thankyou_page_name"`
	LookerReports   string `gorm:"type:text" json:"looker_reports"`
	AdminFee       int       `gorm:"default:0" json:"admin_fee"`

	FundraiserCommissionPercent int `gorm:"default:0" json:"fundraiser_commission_percent"`

	// Payment gateway — Moota (bank mutation). Credentials are TEXT, not varchar(255):
	// Moota's API key is a long RS256 JWT (~700+ chars). A size:255 column overflowed
	// on save → the whole settings UPDATE failed with SQLSTATE 22001 → moota_enabled +
	// webhook secret never persisted → the toggle reverted to "Nonaktif" and the
	// webhook had no secret to verify with. Gateway secrets have no business being
	// length-capped, so all of them are TEXT.
	MootaAPIKey        string `gorm:"type:text" json:"-"`
	MootaWebhookSecret string `gorm:"type:text" json:"-"`
	MootaEnabled       bool   `gorm:"default:false" json:"moota_enabled"`

	// Payment gateway — Flip (payment + disbursement)
	FlipSecretKey       string `gorm:"type:text" json:"-"`
	FlipValidationToken string `gorm:"type:text" json:"-"`
	FlipBaseURL         string `gorm:"size:255" json:"flip_base_url"`
	FlipEnabled         bool   `gorm:"default:false" json:"flip_enabled"`

	// SMTP
	SMTPHost     string `gorm:"size:255" json:"smtp_host"`
	SMTPEmail    string `gorm:"size:255" json:"smtp_email"`
	SMTPPassword string `gorm:"type:text" json:"-"`
	SMTPSSL      string `gorm:"size:10" json:"smtp_ssl"`
	SMTPPort     int    `gorm:"default:587" json:"smtp_port"`
	SMTPName     string `gorm:"size:255" json:"smtp_name"`

	// WhatsApp
	WhatsappProvider         string `gorm:"size:50" json:"whatsapp_provider"`
	WhatsappToken            string `gorm:"type:text" json:"-"`
	WhatsappTokenStarsender  string `gorm:"type:text" json:"-"`

	// Theme
	PaymentProvider    string `gorm:"size:50" json:"payment_provider"`
	ThemeColor         string `gorm:"size:20" json:"theme_color"`
	ProgressbarColor   string `gorm:"size:20" json:"progressbar_color"`
	ButtonColor        string `gorm:"size:20" json:"button_color"`
	PoweredBy          bool   `gorm:"default:true" json:"powered_by"`
	SocialproofSetting bool   `gorm:"default:false" json:"socialproof_setting"`

	FontFamily          string `gorm:"size:100" json:"font_family"`
	BorderRadius        int    `gorm:"default:12" json:"border_radius"`
	ButtonStyle         string `gorm:"size:50" json:"button_style"`
	FormFieldsConfig    string `gorm:"type:text" json:"form_fields_config"`
	NominalPresets      string `gorm:"type:text" json:"nominal_presets"`
	MinDonationGlobal   int64  `gorm:"default:0" json:"min_donation_global"`
	AnonymousDefault    bool   `gorm:"default:false" json:"anonymous_default"`
	MessageEnabled      bool   `gorm:"default:true" json:"message_enabled"`
	SocialProofEnabled  bool   `gorm:"default:false" json:"social_proof_enabled"`
	SocialProofConfig   string `gorm:"type:text" json:"social_proof_config"`
	NotificationConfig  string `gorm:"type:text" json:"notification_config"`
	FundraisingConfig   string `gorm:"type:text" json:"fundraising_config"`

	// Messaging
	WhatsappAdmin    string `gorm:"size:20" json:"whatsapp_admin"`
	TelegramBotToken string `gorm:"type:text" json:"-"`
	TelegramChatID   string `gorm:"size:100" json:"telegram_chat_id"`

	// Donor greeting + CS contact rotator
	DonorGreeting string `gorm:"type:text" json:"donor_greeting"`            // greeting message shown to donor
	CSContacts    string `gorm:"type:text" json:"cs_contacts"`              // JSON array of CS WA contacts (rotator)
	CSRotatorMode string `gorm:"size:20;default:'default'" json:"cs_rotator_mode"` // "default" | "rotator"

	// Ads tracking & pixels
	MetaPixelID           string `gorm:"size:100" json:"meta_pixel_id"`
	MetaCAPIEnabled       bool   `gorm:"default:false" json:"meta_capi_enabled"`
	GTMID                 string `gorm:"size:100" json:"gtm_id"`
	GoogleAdsConversionID string `gorm:"size:100" json:"google_ads_conversion_id"`
	GA4MeasurementID      string `gorm:"size:100" json:"ga4_measurement_id"`
	TiktokPixelID         string `gorm:"size:100" json:"tiktok_pixel_id"`
	TiktokEAPIEnabled     bool   `gorm:"default:false" json:"tiktok_eapi_enabled"`
	LookerStudioEmbed     string `gorm:"type:text" json:"looker_studio_embed"`
	EventTrackingConfig   string `gorm:"type:text" json:"event_tracking_config"` // JSON

	// Moota / Flip detail
	MootaEndpoint         string `gorm:"size:255" json:"moota_endpoint"`
	MootaSignatureEnabled bool   `gorm:"default:true" json:"moota_signature_enabled"`
	MootaDateRange        int    `gorm:"default:7" json:"moota_date_range"`
	FlipMode              string `gorm:"size:20;default:'sandbox'" json:"flip_mode"`
	FlipAutoRedirect      bool   `gorm:"default:true" json:"flip_auto_redirect"`
	FlipChargeFee         string `gorm:"size:20;default:'merchant'" json:"flip_charge_fee"`

	// Unique number / Kode Unik — appended to manual-transfer totals so two transfers
	// of the same nominal can be told apart. Mode: none|fixed|range.
	UniqueCodeMode  string `gorm:"size:10;default:'range'" json:"unique_code_mode"`
	UniqueCodeMin   int    `gorm:"default:1" json:"unique_code_min"`
	UniqueCodeMax   int    `gorm:"default:999" json:"unique_code_max"`
	UniqueCodeFixed int    `gorm:"default:0" json:"unique_code_fixed"`

	// Manual bank-transfer destination shown to the donor when Flip is off (gateway
	// disabled / failed). Was previously per-payment-method; now a single org account.
	BankName        string `gorm:"size:100" json:"bank_name"`
	BankNumber      string `gorm:"size:50" json:"bank_number"`
	BankAccountName string `gorm:"size:150" json:"bank_account_name"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
