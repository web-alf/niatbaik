package request

// UpdateSettingRequest carries a PARTIAL settings patch. The frontend sends only
// the fields a given panel manages, so the backend must distinguish "field absent"
// (leave unchanged) from "field present but empty" (clear it).
//
// Convention:
//   - *string  → display/config fields the admin can legitimately CLEAR. nil = the
//     key was absent (skip); non-nil (incl. "") = set to that value (clears on "").
//   - string with `!= ""` guard in the service → SECRET fields (passwords/keys/
//     tokens). A blank is treated as "keep existing" (masked-field pattern) so an
//     accidental blank save never wipes live gateway/SMTP credentials.
//   - *bool / *int / *int64 → tri-state flags/numbers (nil = skip).
type UpdateSettingRequest struct {
	SiteName                    *string `json:"site_name" validate:"omitempty,max=255"`
	Logo                        *string `json:"logo" validate:"omitempty,max=500"`
	Favicon                     *string `json:"favicon" validate:"omitempty,max=500"`
	Email                       *string `json:"email" validate:"omitempty,max=255"`
	Phone                       *string `json:"phone" validate:"omitempty,max=30"`
	Address                     *string `json:"address" validate:"omitempty,max=1000"`
	Description                 *string `json:"description" validate:"omitempty,max=2000"`
	PrimaryColor                *string `json:"primary_color" validate:"omitempty,max=30"`
	SecondaryColor              *string `json:"secondary_color" validate:"omitempty,max=30"`
	AdminFee                    *int    `json:"admin_fee" validate:"omitempty,min=0,max=10000000"`
	FundraiserCommissionPercent *int    `json:"fundraiser_commission_percent" validate:"omitempty,min=0,max=100"`
	ThemeColor                  *string `json:"theme_color" validate:"omitempty,max=30"`
	ProgressbarColor            *string `json:"progressbar_color" validate:"omitempty,max=30"`
	ButtonColor                 *string `json:"button_color" validate:"omitempty,max=30"`
	WhatsappAdmin               *string `json:"whatsapp_admin" validate:"omitempty,max=30"`
	SocialproofSetting          *bool   `json:"socialproof_setting"`
	SmtpHost                    *string `json:"smtp_host"`
	SmtpEmail                   *string `json:"smtp_email"`
	SmtpPassword                string  `json:"smtp_password"` // secret: blank = keep
	SmtpPort                    *int    `json:"smtp_port"`
	SmtpName                    *string `json:"smtp_name" validate:"omitempty,max=255"`
	PaymentProvider             *string `json:"payment_provider"`

	// General panel fields
	Domain           *string `json:"domain" validate:"omitempty,max=255"`
	Timezone         *string `json:"timezone" validate:"omitempty,max=64"`
	Currency         *string `json:"currency" validate:"omitempty,max=16"`
	SEOTitle         *string `json:"seo_title" validate:"omitempty,max=255"`
	SEODescription   *string `json:"seo_description" validate:"omitempty,max=2000"`
	Maintenance      *bool   `json:"maintenance"`
	FormPageName     *string `json:"form_page_name" validate:"omitempty,max=64"`
	ThankyouPageName *string `json:"thankyou_page_name" validate:"omitempty,max=64"`
	LookerReports    *string `json:"looker_reports" validate:"omitempty,max=65536"`

	// Moota (api key + webhook secret are secrets → blank = keep)
	MootaAPIKey        string `json:"moota_api_key"`
	MootaWebhookSecret string `json:"moota_webhook_secret"`
	MootaEnabled       *bool  `json:"moota_enabled"`

	// Flip (secret key + validation token are secrets → blank = keep)
	FlipSecretKey       string  `json:"flip_secret_key"`
	FlipValidationToken string  `json:"flip_validation_token"`
	FlipBaseURL         *string `json:"flip_base_url"`
	FlipEnabled         *bool   `json:"flip_enabled"`

	// Xendit (secret key + callback token are secrets → blank = keep)
	XenditSecretKey     string  `json:"xendit_secret_key"`
	XenditCallbackToken string  `json:"xendit_callback_token"`
	XenditEnabled       *bool   `json:"xendit_enabled"`
	XenditMode          *string `json:"xendit_mode" validate:"omitempty,oneof=sandbox production"`

	// iPaymu (api key is a secret → blank = keep)
	IpaymuEnabled *bool   `json:"ipaymu_enabled"`
	IpaymuMode    *string `json:"ipaymu_mode" validate:"omitempty,oneof=sandbox production"`
	IpaymuVA      *string `json:"ipaymu_va" validate:"omitempty,max=50"`
	IpaymuAPIKey  string  `json:"ipaymu_api_key"`
	IpaymuBaseURL *string `json:"ipaymu_base_url" validate:"omitempty,max=255"`

	// Duitku (api key + callback key are secrets → blank = keep)
	DuitkuEnabled     *bool   `json:"duitku_enabled"`
	DuitkuMode        *string `json:"duitku_mode" validate:"omitempty,oneof=sandbox production"`
	DuitkuMerchant    *string `json:"duitku_merchant" validate:"omitempty,max=50"`
	DuitkuAPIKey      string  `json:"duitku_api_key"`
	DuitkuCallbackKey string  `json:"duitku_callback_key"`
	DuitkuBaseURL     *string `json:"duitku_base_url" validate:"omitempty,max=255"`

	// Cekat Ai (api key is a secret → blank = keep)
	CekatAIEnabled      *bool   `json:"cekat_ai_enabled"`
	CekatAIEndpoint     *string `json:"cekat_ai_endpoint" validate:"omitempty,max=255"`
	CekatAIKey          string  `json:"cekat_ai_key"`
	CekatAIModel        *string `json:"cekat_ai_model" validate:"omitempty,max=100"`
	CekatAISystemPrompt *string `json:"cekat_ai_system_prompt"`

	// Theme extended
	FontFamily   *string `json:"font_family"`
	BorderRadius *int    `json:"border_radius"`
	ButtonStyle  *string `json:"button_style"`
	// Public-form display styles (admin-selectable, global)
	FormDisplayStyle    *string `json:"form_display_style" validate:"omitempty,oneof=normal bold"`
	PaymentDisplayStyle *string `json:"payment_display_style" validate:"omitempty,oneof=card dropdown"`

	// Form
	FormFieldsConfig  *string `json:"form_fields_config" validate:"omitempty,max=65536"`
	NominalPresets    *string `json:"nominal_presets" validate:"omitempty,max=65536"`
	MinDonationGlobal *int64  `json:"min_donation_global" validate:"omitempty,min=0,max=100000000"`
	AnonymousDefault  *bool   `json:"anonymous_default"`
	MessageEnabled    *bool   `json:"message_enabled"`

	// Donor greeting + CS rotator
	DonorGreeting *string `json:"donor_greeting" validate:"omitempty,max=1000"`
	CSContacts    *string `json:"cs_contacts" validate:"omitempty,max=4000"`
	CSRotatorMode *string `json:"cs_rotator_mode" validate:"omitempty,oneof=default rotator least"`

	// Social proof
	SocialProofEnabled *bool   `json:"social_proof_enabled"`
	SocialProofConfig  *string `json:"social_proof_config" validate:"omitempty,max=65536"`
	NotificationConfig *string `json:"notification_config" validate:"omitempty,max=65536"`
	FundraisingConfig  *string `json:"fundraising_config" validate:"omitempty,max=65536"`

	// Ads tracking & pixels (public IDs — clearable to disable an integration)
	MetaPixelID                        *string `json:"meta_pixel_id"`
	MetaCAPIEnabled                    *bool   `json:"meta_capi_enabled"`
	GTMID                              *string `json:"gtm_id"`
	GoogleAdsConversionID              *string `json:"google_ads_conversion_id"`
	GoogleAdsConversionLabel           *string `json:"google_ads_conversion_label"`
	GoogleAdsCustomerID                *string `json:"google_ads_customer_id" validate:"omitempty,max=20"`
	GoogleAdsLoginCustomerID           *string `json:"google_ads_login_customer_id" validate:"omitempty,max=20"`
	GoogleAdsDefaultConversionActionID *string `json:"google_ads_default_conversion_action_id" validate:"omitempty,max=32"`
	GoogleAdsServerUploadEnabled       *bool   `json:"google_ads_server_upload_enabled"`
	GA4MeasurementID                   *string `json:"ga4_measurement_id"`
	TiktokPixelID                      *string `json:"tiktok_pixel_id"`
	TiktokEAPIEnabled                  *bool   `json:"tiktok_eapi_enabled"`
	MetaCAPIToken                      *string `json:"meta_capi_token"`
	MetaTestEventCode                  *string `json:"meta_test_event_code"`
	TiktokAccessToken                  *string `json:"tiktok_access_token"`
	TiktokTestEventCode                *string `json:"tiktok_test_event_code"`
	GA4APISecret                       *string `json:"ga4_api_secret"`
	LookerStudioEmbed                  *string `json:"looker_studio_embed" validate:"omitempty,max=65536"`
	EventTrackingConfig                *string `json:"event_tracking_config" validate:"omitempty,max=65536"`
	TrackingConfig                     *string `json:"tracking_config" validate:"omitempty,max=65536"`

	// Moota / Flip detail
	MootaEndpoint         *string `json:"moota_endpoint"`
	MootaSignatureEnabled *bool   `json:"moota_signature_enabled"`
	MootaDateRange        *int    `json:"moota_date_range"`
	FlipMode              *string `json:"flip_mode" validate:"omitempty,oneof=sandbox production"`
	FlipAutoRedirect      *bool   `json:"flip_auto_redirect"`
	FlipChargeFee         *string `json:"flip_charge_fee" validate:"omitempty,oneof=merchant donatur"`

	// Payment-method config (JSON blobs; nil=skip, ""=clear to legacy default)
	PaymentMethodTypes *string `json:"payment_method_types" validate:"omitempty,max=8192"`
	FlipCodeConfig     *string `json:"flip_code_config" validate:"omitempty,max=16384"`
	ManualBanks        *string `json:"manual_banks" validate:"omitempty,max=8192"`
	// Per-channel gateway routing map (JSON {channelKey: flip|moota|manual}) + Moota
	// outbound-gateway config. nil=skip, ""=clear to legacy default.
	PaymentChannelGateways *string `json:"payment_channel_gateways" validate:"omitempty,max=8192"`
	MootaGatewayEnabled    *bool   `json:"moota_gateway_enabled"`
	MootaGatewayAccountID  *string `json:"moota_gateway_account_id" validate:"omitempty,max=100"`

	// Unique number / Kode Unik
	UniqueCodeMode  *string `json:"unique_code_mode" validate:"omitempty,oneof=none fixed range"`
	UniqueCodeMin   *int    `json:"unique_code_min" validate:"omitempty,min=0,max=99999"`
	UniqueCodeMax   *int    `json:"unique_code_max" validate:"omitempty,min=0,max=99999"`
	UniqueCodeFixed *int    `json:"unique_code_fixed" validate:"omitempty,min=0,max=99999"`

	// Manual bank-transfer destination
	BankName        *string `json:"bank_name" validate:"omitempty,max=100"`
	BankNumber      *string `json:"bank_number" validate:"omitempty,max=50"`
	BankAccountName *string `json:"bank_account_name" validate:"omitempty,max=150"`
}
