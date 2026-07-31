package service

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/anrdart/niatbaik-api/internal/config"
	"github.com/anrdart/niatbaik-api/internal/dto/request"
	"github.com/anrdart/niatbaik-api/internal/model"
	"github.com/anrdart/niatbaik-api/internal/repository"
	"github.com/anrdart/niatbaik-api/pkg/jwt"
	"github.com/anrdart/niatbaik-api/pkg/mailer"
	"github.com/google/uuid"
)

// validCSContacts returns true when s is empty or a JSON array of CS contacts
// where every phone is 8–15 digits. Guards both malformed JSON and bad phone shape.
func validCSContacts(s string) bool {
	if s == "" {
		return true
	}
	var contacts []struct {
		Phone string `json:"phone"`
		Name  string `json:"name"`
	}
	if err := json.Unmarshal([]byte(s), &contacts); err != nil {
		return false
	}
	for _, ct := range contacts {
		digits := strings.Map(func(r rune) rune {
			if r >= '0' && r <= '9' {
				return r
			}
			return -1
		}, ct.Phone)
		if len(digits) < 8 || len(digits) > 15 {
			return false
		}
	}
	return true
}

// ErrValidation marks an error as a client-side validation failure (HTTP 422),
// distinguishing it from server/DB failures (HTTP 500).
var ErrValidation = errors.New("validation error")

// GoogleAdsConnector is the subset of the Data Manager client used by the
// "Connect Google Ads" OAuth flow. Kept narrow so the service depends only on
// what it needs and tests can fake it.
type GoogleAdsConnector interface {
	AuthCodeURL(redirectURI, state string) string
	ExchangeCode(ctx context.Context, code, redirectURI string) (refreshToken, email string, err error)
	SetRefreshToken(token string)
}

type SettingService struct {
	settingRepo *repository.SettingRepo
	cfg         *config.Config
	dataManager DataManagerClient
	connector   GoogleAdsConnector
}

// googleAdsTokenReady reports whether server-side upload can authenticate: the
// OAuth app identity must exist AND a refresh token must be available from
// either the database (Connect flow) or the environment (legacy).
func googleAdsTokenReady(oauthConfigured bool, envToken, dbToken string) bool {
	return oauthConfigured && (strings.TrimSpace(envToken) != "" || strings.TrimSpace(dbToken) != "")
}

// interpretTestConnection maps a validate-only probe result to a pass/fail.
// The probe carries no click id on purpose, so NO_IDENTIFIERS_PROVIDED means the
// destination was reachable and authorized — a success for connection testing.
func interpretTestConnection(err error) error {
	if err == nil {
		return nil
	}
	var de *DispatchError
	if errors.As(err, &de) && strings.Contains(de.Summary, "NO_IDENTIFIERS_PROVIDED") {
		return nil
	}
	return err
}

func NewSettingService(settingRepo *repository.SettingRepo, cfg *config.Config, clients ...DataManagerClient) *SettingService {
	s := &SettingService{settingRepo: settingRepo, cfg: cfg}
	if len(clients) > 0 {
		s.dataManager = clients[0]
		if connector, ok := clients[0].(GoogleAdsConnector); ok {
			s.connector = connector
		}
	}
	return s
}

// FrontendSettingsURL is the admin settings page the OAuth callback redirects to.
func (s *SettingService) FrontendSettingsURL() string {
	return s.cfg.FrontendBaseURL + "/settings"
}

// SeedGoogleAdsToken loads a DB-stored refresh token (from a prior Connect) into
// the live client at startup so it takes precedence over the env token without a
// restart. No-op when the DB has none.
func (s *SettingService) SeedGoogleAdsToken() {
	if s.connector == nil {
		return
	}
	setting, err := s.settingRepo.Get()
	if err != nil || setting == nil {
		return
	}
	if strings.TrimSpace(setting.GoogleAdsRefreshToken) != "" {
		s.connector.SetRefreshToken(setting.GoogleAdsRefreshToken)
	}
}

// googleAdsOAuthStateRole tags the short-lived state JWT so it can't be confused
// with a normal auth token.
const googleAdsOAuthStateRole = "google_ads_oauth_state"

// GoogleAdsOAuthStartURL builds the consent-screen URL with a signed, short-lived
// state param bound to the initiating admin — this doubles as CSRF protection for
// the unauthenticated callback.
func (s *SettingService) GoogleAdsOAuthStartURL(userID uuid.UUID) (string, error) {
	if s.connector == nil || !s.cfg.GoogleAdsOAuthConfigured() {
		return "", fmt.Errorf("%w: OAuth client belum dikonfigurasi di backend", ErrValidation)
	}
	state, err := jwt.GenerateAccessToken(userID, "", googleAdsOAuthStateRole, s.cfg.JWTSecret, 10*time.Minute)
	if err != nil {
		return "", err
	}
	return s.connector.AuthCodeURL(s.cfg.GoogleAdsRedirectURI(), state), nil
}

// ConnectGoogleAds verifies the state, exchanges the OAuth code for a refresh
// token, persists it plus the granting account email, and swaps it into the live
// client immediately.
func (s *SettingService) ConnectGoogleAds(ctx context.Context, code, state string) (string, error) {
	if s.connector == nil || !s.cfg.GoogleAdsOAuthConfigured() {
		return "", fmt.Errorf("%w: OAuth client belum dikonfigurasi di backend", ErrValidation)
	}
	claims, err := jwt.ParseToken(state, s.cfg.JWTSecret)
	if err != nil || claims.Role != googleAdsOAuthStateRole {
		return "", fmt.Errorf("%w: state OAuth tidak valid atau kedaluwarsa", ErrValidation)
	}
	token, email, err := s.connector.ExchangeCode(ctx, code, s.cfg.GoogleAdsRedirectURI())
	if err != nil {
		return "", err
	}
	if err := s.settingRepo.UpdateGoogleAds(map[string]any{
		"google_ads_refresh_token":   token,
		"google_ads_connected_email": email,
	}); err != nil {
		return "", err
	}
	s.connector.SetRefreshToken(token)
	return email, nil
}

func (s *SettingService) TestGoogleAds(ctx context.Context) (map[string]string, error) {
	setting, err := s.Get()
	if err != nil {
		return nil, err
	}
	if err := googleAdsReadinessError(s.GoogleAdsCredentialsConfigured(), setting.GoogleAdsCustomerID, setting.GoogleAdsDefaultConversionActionID, s.dataManager != nil); err != nil {
		return nil, err
	}
	// eventSource=WEB and no ad identifier: a well-configured destination answers
	// NO_IDENTIFIERS_PROVIDED, which interpretTestConnection treats as reachable.
	// This proves auth + destination permission + a valid conversion action without
	// fabricating a click id.
	_, err = s.dataManager.Ingest(ctx, GoogleAdsConversion{CustomerID: setting.GoogleAdsCustomerID, LoginCustomerID: setting.GoogleAdsLoginCustomerID, ConversionActionID: setting.GoogleAdsDefaultConversionActionID, Timestamp: time.Now(), Value: 1, Currency: "IDR", TransactionID: "VALIDATE-" + uuid.NewString(), EventSource: "WEB"}, true)
	if err := interpretTestConnection(err); err != nil {
		return nil, err
	}
	return map[string]string{"customer_id": setting.GoogleAdsCustomerID, "conversion_action_id": setting.GoogleAdsDefaultConversionActionID, "status": "valid"}, nil
}

func (s *SettingService) GoogleAdsCredentialsConfigured() bool {
	if s.cfg == nil {
		return false
	}
	dbToken := ""
	if setting, err := s.settingRepo.Get(); err == nil && setting != nil {
		dbToken = setting.GoogleAdsRefreshToken
	}
	return googleAdsTokenReady(s.cfg.GoogleAdsOAuthConfigured(), s.cfg.GoogleDataManagerRefreshToken, dbToken)
}

func (s *SettingService) Get() (*model.Setting, error) {
	return s.settingRepo.Get()
}

// SendTestEmail sends a test message using the saved SMTP settings, so an admin can
// verify the configuration before relying on it for real donor receipts. Returns a
// validation error when SMTP is not configured or the recipient is missing.
func (s *SettingService) SendTestEmail(to string) error {
	to = strings.TrimSpace(to)
	if to == "" {
		return fmt.Errorf("%w: alamat email tujuan wajib diisi", ErrValidation)
	}
	setting, err := s.settingRepo.Get()
	if err != nil {
		return err
	}

	if setting.SMTPHost == "" || setting.SMTPEmail == "" || setting.SMTPPassword == "" || setting.SMTPPort == 0 {
		return fmt.Errorf("%w: SMTP belum dikonfigurasi (host/email/password/port)", ErrValidation)
	}
	cfg := mailer.Config{
		Host:     setting.SMTPHost,
		Port:     setting.SMTPPort,
		Email:    setting.SMTPEmail,
		Password: setting.SMTPPassword,
		Name:     setting.SMTPName,
	}
	body := `<div style="font-family:sans-serif;max-width:480px;margin:auto">
	  <h2 style="color:#2E4191">Tes Email NIATBAIK.ORG</h2>
	  <p>Jika Anda menerima email ini, konfigurasi SMTP Anda sudah benar. 🎉</p>
	  <p style="color:#64748B;font-size:13px">Email ini dikirim dari halaman Settings → Notification.</p>
	</div>`
	if err := mailer.Send(cfg, to, "Tes Email NIATBAIK.ORG", body); err != nil {
		return fmt.Errorf("gagal mengirim email tes: %w", err)
	}
	return nil
}

func (s *SettingService) Update(req *request.UpdateSettingRequest) error {
	setting, err := s.settingRepo.Get()
	if err != nil {
		return err
	}

	googleFields := map[string]any{}
	customer, login, action, enabled := setting.GoogleAdsCustomerID, setting.GoogleAdsLoginCustomerID, setting.GoogleAdsDefaultConversionActionID, setting.GoogleAdsServerUploadEnabled
	if req.GoogleAdsCustomerID != nil {
		customer, err = normalizeGoogleCustomerID(*req.GoogleAdsCustomerID, true)
		if err != nil {
			return fmt.Errorf("%w: %v", ErrValidation, err)
		}
		googleFields["google_ads_customer_id"] = customer
	}
	if req.GoogleAdsLoginCustomerID != nil {
		login, err = normalizeGoogleCustomerID(*req.GoogleAdsLoginCustomerID, true)
		if err != nil {
			return fmt.Errorf("%w: %v", ErrValidation, err)
		}
		googleFields["google_ads_login_customer_id"] = login
	}
	if req.GoogleAdsDefaultConversionActionID != nil {
		action, err = normalizeGoogleActionID(*req.GoogleAdsDefaultConversionActionID, true)
		if err != nil {
			return fmt.Errorf("%w: %v", ErrValidation, err)
		}
		googleFields["google_ads_default_conversion_action_id"] = action
	}
	if req.GoogleAdsServerUploadEnabled != nil {
		enabled = *req.GoogleAdsServerUploadEnabled
		googleFields["google_ads_server_upload_enabled"] = enabled
	}
	if enabled && (!s.GoogleAdsCredentialsConfigured() || customer == "" || action == "") {
		return fmt.Errorf("%w: OAuth environment, Customer ID, dan default Conversion Action ID wajib dikonfigurasi sebelum server upload diaktifkan", ErrValidation)
	}
	if len(googleFields) > 0 {
		if err := s.settingRepo.UpdateGoogleAds(googleFields); err != nil {
			return err
		}
		setting.GoogleAdsCustomerID, setting.GoogleAdsLoginCustomerID, setting.GoogleAdsDefaultConversionActionID, setting.GoogleAdsServerUploadEnabled = customer, login, action, enabled
	}
	// Display/config string fields use *string semantics: nil = key absent in this
	// patch (leave unchanged), non-nil = set to the given value (empty string CLEARS
	// it). This is what lets an admin remove a logo, blank a pixel id, etc. — the old
	// `!= ""` guard made every string field impossible to clear.
	set := func(dst *string, v *string) {
		if v != nil {
			*dst = *v
		}
	}
	set(&setting.SiteName, req.SiteName)
	set(&setting.Logo, req.Logo)
	set(&setting.Favicon, req.Favicon)
	set(&setting.Email, req.Email)
	set(&setting.Phone, req.Phone)
	set(&setting.Address, req.Address)
	set(&setting.Description, req.Description)
	set(&setting.PrimaryColor, req.PrimaryColor)
	set(&setting.SecondaryColor, req.SecondaryColor)
	set(&setting.ThemeColor, req.ThemeColor)
	set(&setting.ProgressbarColor, req.ProgressbarColor)
	set(&setting.ButtonColor, req.ButtonColor)
	set(&setting.WhatsappAdmin, req.WhatsappAdmin)
	set(&setting.SMTPHost, req.SmtpHost)
	set(&setting.SMTPEmail, req.SmtpEmail)
	set(&setting.SMTPName, req.SmtpName)
	set(&setting.PaymentProvider, req.PaymentProvider)
	set(&setting.Domain, req.Domain)
	set(&setting.Timezone, req.Timezone)
	set(&setting.Currency, req.Currency)
	set(&setting.SEOTitle, req.SEOTitle)
	set(&setting.SEODescription, req.SEODescription)
	set(&setting.FormPageName, req.FormPageName)
	set(&setting.ThankyouPageName, req.ThankyouPageName)
	set(&setting.LookerReports, req.LookerReports)
	set(&setting.FlipBaseURL, req.FlipBaseURL)
	set(&setting.FontFamily, req.FontFamily)
	set(&setting.ButtonStyle, req.ButtonStyle)
	set(&setting.FormDisplayStyle, req.FormDisplayStyle)
	set(&setting.PaymentDisplayStyle, req.PaymentDisplayStyle)
	set(&setting.XenditMode, req.XenditMode)
	set(&setting.FormFieldsConfig, req.FormFieldsConfig)
	set(&setting.NominalPresets, req.NominalPresets)
	set(&setting.SocialProofConfig, req.SocialProofConfig)
	set(&setting.NotificationConfig, req.NotificationConfig)
	set(&setting.FundraisingConfig, req.FundraisingConfig)
	set(&setting.MetaPixelID, req.MetaPixelID)
	set(&setting.GTMID, req.GTMID)
	set(&setting.GoogleAdsConversionID, req.GoogleAdsConversionID)
	set(&setting.GoogleAdsConversionLabel, req.GoogleAdsConversionLabel)
	set(&setting.GA4MeasurementID, req.GA4MeasurementID)
	set(&setting.TiktokPixelID, req.TiktokPixelID)
	set(&setting.LookerStudioEmbed, req.LookerStudioEmbed)
	set(&setting.EventTrackingConfig, req.EventTrackingConfig)
	set(&setting.MootaEndpoint, req.MootaEndpoint)
	set(&setting.FlipMode, req.FlipMode)
	set(&setting.FlipChargeFee, req.FlipChargeFee)
	set(&setting.UniqueCodeMode, req.UniqueCodeMode)
	set(&setting.BankName, req.BankName)
	set(&setting.BankNumber, req.BankNumber)
	set(&setting.BankAccountName, req.BankAccountName)
	set(&setting.PaymentMethodTypes, req.PaymentMethodTypes)
	set(&setting.FlipCodeConfig, req.FlipCodeConfig)
	set(&setting.ManualBanks, req.ManualBanks)
	set(&setting.PaymentChannelGateways, req.PaymentChannelGateways)
	set(&setting.MootaGatewayAccountID, req.MootaGatewayAccountID)

	// SECRET fields keep "blank = keep existing" (masked-field pattern) so an
	// accidental blank save never wipes live SMTP / gateway credentials.
	if req.SmtpPassword != "" {
		setting.SMTPPassword = req.SmtpPassword
	}
	if req.MootaAPIKey != "" {
		setting.MootaAPIKey = req.MootaAPIKey
	}
	if req.MootaWebhookSecret != "" {
		setting.MootaWebhookSecret = req.MootaWebhookSecret
	}
	if req.FlipSecretKey != "" {
		setting.FlipSecretKey = req.FlipSecretKey
	}
	if req.FlipValidationToken != "" {
		setting.FlipValidationToken = req.FlipValidationToken
	}
	if req.XenditSecretKey != "" {
		setting.XenditSecretKey = req.XenditSecretKey
	}
	if req.XenditCallbackToken != "" {
		setting.XenditCallbackToken = req.XenditCallbackToken
	}
	if req.IpaymuAPIKey != "" {
		setting.IpaymuAPIKey = req.IpaymuAPIKey
	}
	if req.DuitkuAPIKey != "" {
		setting.DuitkuAPIKey = req.DuitkuAPIKey
	}
	if req.DuitkuCallbackKey != "" {
		setting.DuitkuCallbackKey = req.DuitkuCallbackKey
	}
	if req.CekatAIKey != "" {
		setting.CekatAIKey = req.CekatAIKey
	}

	// Numeric + boolean tri-state fields (nil = absent = skip).
	if req.AdminFee != nil {
		setting.AdminFee = *req.AdminFee
	}
	if req.FundraiserCommissionPercent != nil {
		setting.FundraiserCommissionPercent = *req.FundraiserCommissionPercent
	}
	if req.SocialproofSetting != nil {
		setting.SocialproofSetting = *req.SocialproofSetting
	}
	if req.SmtpPort != nil {
		setting.SMTPPort = *req.SmtpPort
	}
	if req.Maintenance != nil {
		setting.Maintenance = *req.Maintenance
	}
	if req.MootaEnabled != nil {
		setting.MootaEnabled = *req.MootaEnabled
	}
	if req.FlipEnabled != nil {
		setting.FlipEnabled = *req.FlipEnabled
	}
	if req.XenditEnabled != nil {
		setting.XenditEnabled = *req.XenditEnabled
	}
	if req.MootaGatewayEnabled != nil {
		setting.MootaGatewayEnabled = *req.MootaGatewayEnabled
	}
	// iPaymu / Duitku / Cekat Ai gates + non-secret config (tri-state pointers → nil-guard
	// so a save from an unrelated settings panel never flips the flag off).
	if req.IpaymuEnabled != nil {
		setting.IpaymuEnabled = *req.IpaymuEnabled
	}
	set(&setting.IpaymuMode, req.IpaymuMode)
	set(&setting.IpaymuVA, req.IpaymuVA)
	set(&setting.IpaymuBaseURL, req.IpaymuBaseURL)
	if req.DuitkuEnabled != nil {
		setting.DuitkuEnabled = *req.DuitkuEnabled
	}
	set(&setting.DuitkuMode, req.DuitkuMode)
	set(&setting.DuitkuMerchant, req.DuitkuMerchant)
	set(&setting.DuitkuBaseURL, req.DuitkuBaseURL)
	if req.CekatAIEnabled != nil {
		setting.CekatAIEnabled = *req.CekatAIEnabled
	}
	set(&setting.CekatAIEndpoint, req.CekatAIEndpoint)
	set(&setting.CekatAIModel, req.CekatAIModel)
	set(&setting.CekatAISystemPrompt, req.CekatAISystemPrompt)
	if req.BorderRadius != nil {
		setting.BorderRadius = *req.BorderRadius
	}
	if req.MinDonationGlobal != nil {
		setting.MinDonationGlobal = *req.MinDonationGlobal
	}
	if req.AnonymousDefault != nil {
		setting.AnonymousDefault = *req.AnonymousDefault
	}
	if req.MessageEnabled != nil {
		setting.MessageEnabled = *req.MessageEnabled
	}
	if req.DonorGreeting != nil {
		setting.DonorGreeting = *req.DonorGreeting
	}
	if req.CSContacts != nil {
		if !validCSContacts(*req.CSContacts) {
			return fmt.Errorf("%w: cs_contacts harus JSON array dengan nomor telepon 8–15 digit", ErrValidation)
		}
		setting.CSContacts = *req.CSContacts
	}
	if req.CSRotatorMode != nil {
		setting.CSRotatorMode = *req.CSRotatorMode
	}
	if req.SocialProofEnabled != nil {
		setting.SocialProofEnabled = *req.SocialProofEnabled
	}
	if req.MetaCAPIEnabled != nil {
		setting.MetaCAPIEnabled = *req.MetaCAPIEnabled
	}
	if req.TiktokEAPIEnabled != nil {
		setting.TiktokEAPIEnabled = *req.TiktokEAPIEnabled
	}
	if req.MetaCAPIToken != nil {
		setting.MetaCAPIToken = *req.MetaCAPIToken
	}
	if req.MetaTestEventCode != nil {
		setting.MetaTestEventCode = *req.MetaTestEventCode
	}
	if req.TiktokAccessToken != nil {
		setting.TiktokAccessToken = *req.TiktokAccessToken
	}
	if req.TiktokTestEventCode != nil {
		setting.TiktokTestEventCode = *req.TiktokTestEventCode
	}
	if req.GA4APISecret != nil {
		setting.GA4APISecret = *req.GA4APISecret
	}
	if req.MootaSignatureEnabled != nil {
		setting.MootaSignatureEnabled = *req.MootaSignatureEnabled
	}
	if req.MootaDateRange != nil {
		setting.MootaDateRange = *req.MootaDateRange
	}
	if req.FlipAutoRedirect != nil {
		setting.FlipAutoRedirect = *req.FlipAutoRedirect
	}
	if req.UniqueCodeMin != nil {
		setting.UniqueCodeMin = *req.UniqueCodeMin
	}
	if req.UniqueCodeMax != nil {
		setting.UniqueCodeMax = *req.UniqueCodeMax
	}
	if req.UniqueCodeFixed != nil {
		setting.UniqueCodeFixed = *req.UniqueCodeFixed
	}

	return s.settingRepo.Update(setting)
}
