package request

type UpdateSettingRequest struct {
	SiteName                    string `json:"site_name" validate:"omitempty,max=255"`
	Logo                        string `json:"logo" validate:"omitempty,max=500"`
	Favicon                     string `json:"favicon" validate:"omitempty,max=500"`
	Email                       string `json:"email" validate:"omitempty,max=255"`
	Phone                       string `json:"phone" validate:"omitempty,max=30"`
	Address                     string `json:"address" validate:"omitempty,max=1000"`
	Description                 string `json:"description" validate:"omitempty,max=2000"`
	PrimaryColor                string `json:"primary_color" validate:"omitempty,max=30"`
	SecondaryColor              string `json:"secondary_color" validate:"omitempty,max=30"`
	AdminFee                    *int   `json:"admin_fee" validate:"omitempty,min=0,max=10000000"`
	FundraiserCommissionPercent *int   `json:"fundraiser_commission_percent" validate:"omitempty,min=0,max=100"`
	ThemeColor                  string `json:"theme_color" validate:"omitempty,max=30"`
	ProgressbarColor            string `json:"progressbar_color" validate:"omitempty,max=30"`
	ButtonColor                 string `json:"button_color" validate:"omitempty,max=30"`
	WhatsappAdmin               string `json:"whatsapp_admin" validate:"omitempty,max=30"`
	SocialproofSetting          *bool  `json:"socialproof_setting"`
	IpaymuVA                    string `json:"ipaymu_va"`
	IpaymuSecret                string `json:"ipaymu_secret"`
	IpaymuURL                   string `json:"ipaymu_url"`
	SmtpHost                    string `json:"smtp_host"`
	SmtpEmail                   string `json:"smtp_email"`
	SmtpPassword                string `json:"smtp_password"`
	SmtpPort                    *int   `json:"smtp_port"`
	PaymentProvider             string `json:"payment_provider"`

	// Moota
	MootaAPIKey        string `json:"moota_api_key"`
	MootaWebhookSecret string `json:"moota_webhook_secret"`
	MootaEnabled       *bool  `json:"moota_enabled"`

	// Flip
	FlipSecretKey       string `json:"flip_secret_key"`
	FlipValidationToken string `json:"flip_validation_token"`
	FlipBaseURL         string `json:"flip_base_url"`
	FlipEnabled         *bool  `json:"flip_enabled"`

	// Theme extended
	FontFamily    string `json:"font_family"`
	BorderRadius  *int   `json:"border_radius"`
	ButtonStyle   string `json:"button_style"`

	// Form
	FormFieldsConfig  string `json:"form_fields_config" validate:"omitempty,max=65536"`
	NominalPresets    string `json:"nominal_presets" validate:"omitempty,max=65536"`
	MinDonationGlobal *int64 `json:"min_donation_global"`
	AnonymousDefault  *bool  `json:"anonymous_default"`
	MessageEnabled    *bool  `json:"message_enabled"`

	// Donor greeting + CS rotator
	DonorGreeting *string `json:"donor_greeting" validate:"omitempty,max=1000"`
	CSContacts    *string `json:"cs_contacts" validate:"omitempty,max=4000"`
	CSRotatorMode *string `json:"cs_rotator_mode" validate:"omitempty,oneof=default rotator"`

	// Social proof
	SocialProofEnabled *bool  `json:"social_proof_enabled"`
	SocialProofConfig  string `json:"social_proof_config" validate:"omitempty,max=65536"`
	NotificationConfig string `json:"notification_config" validate:"omitempty,max=65536"`
	FundraisingConfig  string `json:"fundraising_config" validate:"omitempty,max=65536"`

	// Ads tracking & pixels
	MetaPixelID           string `json:"meta_pixel_id"`
	MetaCAPIEnabled       *bool  `json:"meta_capi_enabled"`
	GTMID                 string `json:"gtm_id"`
	GoogleAdsConversionID string `json:"google_ads_conversion_id"`
	GA4MeasurementID      string `json:"ga4_measurement_id"`
	TiktokPixelID         string `json:"tiktok_pixel_id"`
	TiktokEAPIEnabled     *bool  `json:"tiktok_eapi_enabled"`
	LookerStudioEmbed     string `json:"looker_studio_embed" validate:"omitempty,max=65536"`
	EventTrackingConfig   string `json:"event_tracking_config" validate:"omitempty,max=65536"`

	// Moota / Flip detail
	MootaEndpoint         string `json:"moota_endpoint"`
	MootaSignatureEnabled *bool  `json:"moota_signature_enabled"`
	MootaDateRange        *int   `json:"moota_date_range"`
	FlipMode              string `json:"flip_mode"`
	FlipAutoRedirect      *bool  `json:"flip_auto_redirect"`
	FlipChargeFee         string `json:"flip_charge_fee"`
}
