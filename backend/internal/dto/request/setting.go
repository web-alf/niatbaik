package request

type UpdateSettingRequest struct {
	SiteName                    string `json:"site_name"`
	Logo                        string `json:"logo"`
	Favicon                     string `json:"favicon"`
	Email                       string `json:"email"`
	Phone                       string `json:"phone"`
	Address                     string `json:"address"`
	Description                 string `json:"description"`
	PrimaryColor                string `json:"primary_color"`
	SecondaryColor              string `json:"secondary_color"`
	AdminFee                    *int   `json:"admin_fee" validate:"omitempty,min=0,max=10000000"`
	FundraiserCommissionPercent *int   `json:"fundraiser_commission_percent" validate:"omitempty,min=0,max=100"`
	ThemeColor                  string `json:"theme_color"`
	ProgressbarColor            string `json:"progressbar_color"`
	ButtonColor                 string `json:"button_color"`
	WhatsappAdmin               string `json:"whatsapp_admin"`
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
	FormFieldsConfig  string `json:"form_fields_config"`
	NominalPresets    string `json:"nominal_presets"`
	MinDonationGlobal *int64 `json:"min_donation_global"`
	AnonymousDefault  *bool  `json:"anonymous_default"`
	MessageEnabled    *bool  `json:"message_enabled"`

	// Social proof
	SocialProofEnabled *bool  `json:"social_proof_enabled"`
	SocialProofConfig  string `json:"social_proof_config"`
	NotificationConfig string `json:"notification_config"`
	FundraisingConfig  string `json:"fundraising_config"`

	// Ads tracking & pixels
	MetaPixelID           string `json:"meta_pixel_id"`
	MetaCAPIEnabled       *bool  `json:"meta_capi_enabled"`
	GTMID                 string `json:"gtm_id"`
	GoogleAdsConversionID string `json:"google_ads_conversion_id"`
	GA4MeasurementID      string `json:"ga4_measurement_id"`
	TiktokPixelID         string `json:"tiktok_pixel_id"`
	TiktokEAPIEnabled     *bool  `json:"tiktok_eapi_enabled"`
	LookerStudioEmbed     string `json:"looker_studio_embed"`
	EventTrackingConfig   string `json:"event_tracking_config"`

	// Moota / Flip detail
	MootaEndpoint         string `json:"moota_endpoint"`
	MootaSignatureEnabled *bool  `json:"moota_signature_enabled"`
	MootaDateRange        *int   `json:"moota_date_range"`
	FlipMode              string `json:"flip_mode"`
	FlipAutoRedirect      *bool  `json:"flip_auto_redirect"`
	FlipChargeFee         string `json:"flip_charge_fee"`
}
