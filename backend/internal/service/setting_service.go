package service

import (
	"encoding/json"
	"errors"
	"fmt"
	"strings"

	"github.com/anrdart/niatbaik-api/internal/dto/request"
	"github.com/anrdart/niatbaik-api/internal/model"
	"github.com/anrdart/niatbaik-api/internal/repository"
	"github.com/anrdart/niatbaik-api/pkg/mailer"
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

type SettingService struct {
	settingRepo *repository.SettingRepo
}

func NewSettingService(settingRepo *repository.SettingRepo) *SettingService {
	return &SettingService{settingRepo: settingRepo}
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
	set(&setting.FormFieldsConfig, req.FormFieldsConfig)
	set(&setting.NominalPresets, req.NominalPresets)
	set(&setting.SocialProofConfig, req.SocialProofConfig)
	set(&setting.NotificationConfig, req.NotificationConfig)
	set(&setting.FundraisingConfig, req.FundraisingConfig)
	set(&setting.MetaPixelID, req.MetaPixelID)
	set(&setting.GTMID, req.GTMID)
	set(&setting.GoogleAdsConversionID, req.GoogleAdsConversionID)
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
