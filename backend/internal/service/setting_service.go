package service

import (
	"encoding/json"
	"errors"
	"fmt"
	"strings"

	"github.com/anrdart/niatbaik-api/internal/dto/request"
	"github.com/anrdart/niatbaik-api/internal/model"
	"github.com/anrdart/niatbaik-api/internal/repository"
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

func (s *SettingService) Update(req *request.UpdateSettingRequest) error {
	setting, err := s.settingRepo.Get()
	if err != nil {
		return err
	}

	// Only update non-empty fields
	if req.SiteName != "" {
		setting.SiteName = req.SiteName
	}
	if req.Logo != "" {
		setting.Logo = req.Logo
	}
	if req.Favicon != "" {
		setting.Favicon = req.Favicon
	}
	if req.Email != "" {
		setting.Email = req.Email
	}
	if req.Phone != "" {
		setting.Phone = req.Phone
	}
	if req.Address != "" {
		setting.Address = req.Address
	}
	if req.Description != "" {
		setting.Description = req.Description
	}
	if req.PrimaryColor != "" {
		setting.PrimaryColor = req.PrimaryColor
	}
	if req.SecondaryColor != "" {
		setting.SecondaryColor = req.SecondaryColor
	}
	if req.AdminFee != nil {
		setting.AdminFee = *req.AdminFee
	}
	if req.FundraiserCommissionPercent != nil {
		setting.FundraiserCommissionPercent = *req.FundraiserCommissionPercent
	}
	if req.ThemeColor != "" {
		setting.ThemeColor = req.ThemeColor
	}
	if req.ProgressbarColor != "" {
		setting.ProgressbarColor = req.ProgressbarColor
	}
	if req.ButtonColor != "" {
		setting.ButtonColor = req.ButtonColor
	}
	if req.WhatsappAdmin != "" {
		setting.WhatsappAdmin = req.WhatsappAdmin
	}
	if req.SocialproofSetting != nil {
		setting.SocialproofSetting = *req.SocialproofSetting
	}
	if req.IpaymuVA != "" {
		setting.IpaymuVA = req.IpaymuVA
	}
	if req.IpaymuSecret != "" {
		setting.IpaymuSecret = req.IpaymuSecret
	}
	if req.IpaymuURL != "" {
		setting.IpaymuURL = req.IpaymuURL
	}
	if req.SmtpHost != "" {
		setting.SMTPHost = req.SmtpHost
	}
	if req.SmtpEmail != "" {
		setting.SMTPEmail = req.SmtpEmail
	}
	if req.SmtpPassword != "" {
		setting.SMTPPassword = req.SmtpPassword
	}
	if req.SmtpPort != nil {
		setting.SMTPPort = *req.SmtpPort
	}
	if req.SmtpName != "" {
		setting.SMTPName = req.SmtpName
	}
	if req.PaymentProvider != "" {
		setting.PaymentProvider = req.PaymentProvider
	}

	// General panel fields
	if req.Domain != "" {
		setting.Domain = req.Domain
	}
	if req.Timezone != "" {
		setting.Timezone = req.Timezone
	}
	if req.Currency != "" {
		setting.Currency = req.Currency
	}
	if req.SEOTitle != "" {
		setting.SEOTitle = req.SEOTitle
	}
	if req.SEODescription != "" {
		setting.SEODescription = req.SEODescription
	}
	if req.Maintenance != nil {
		setting.Maintenance = *req.Maintenance
	}
	if req.FormPageName != "" {
		setting.FormPageName = req.FormPageName
	}
	if req.ThankyouPageName != "" {
		setting.ThankyouPageName = req.ThankyouPageName
	}
	if req.LookerReports != "" {
		setting.LookerReports = req.LookerReports
	}
	if req.MootaAPIKey != "" {
		setting.MootaAPIKey = req.MootaAPIKey
	}
	if req.MootaWebhookSecret != "" {
		setting.MootaWebhookSecret = req.MootaWebhookSecret
	}
	if req.MootaEnabled != nil {
		setting.MootaEnabled = *req.MootaEnabled
	}
	if req.FlipSecretKey != "" {
		setting.FlipSecretKey = req.FlipSecretKey
	}
	if req.FlipValidationToken != "" {
		setting.FlipValidationToken = req.FlipValidationToken
	}
	if req.FlipBaseURL != "" {
		setting.FlipBaseURL = req.FlipBaseURL
	}
	if req.FlipEnabled != nil {
		setting.FlipEnabled = *req.FlipEnabled
	}
	if req.FontFamily != "" {
		setting.FontFamily = req.FontFamily
	}
	if req.BorderRadius != nil {
		setting.BorderRadius = *req.BorderRadius
	}
	if req.ButtonStyle != "" {
		setting.ButtonStyle = req.ButtonStyle
	}
	if req.FormFieldsConfig != "" {
		setting.FormFieldsConfig = req.FormFieldsConfig
	}
	if req.NominalPresets != "" {
		setting.NominalPresets = req.NominalPresets
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
	if req.SocialProofConfig != "" {
		setting.SocialProofConfig = req.SocialProofConfig
	}
	if req.NotificationConfig != "" {
		setting.NotificationConfig = req.NotificationConfig
	}
	if req.FundraisingConfig != "" {
		setting.FundraisingConfig = req.FundraisingConfig
	}

	// Ads tracking & pixels
	if req.MetaPixelID != "" {
		setting.MetaPixelID = req.MetaPixelID
	}
	if req.MetaCAPIEnabled != nil {
		setting.MetaCAPIEnabled = *req.MetaCAPIEnabled
	}
	if req.GTMID != "" {
		setting.GTMID = req.GTMID
	}
	if req.GoogleAdsConversionID != "" {
		setting.GoogleAdsConversionID = req.GoogleAdsConversionID
	}
	if req.GA4MeasurementID != "" {
		setting.GA4MeasurementID = req.GA4MeasurementID
	}
	if req.TiktokPixelID != "" {
		setting.TiktokPixelID = req.TiktokPixelID
	}
	if req.TiktokEAPIEnabled != nil {
		setting.TiktokEAPIEnabled = *req.TiktokEAPIEnabled
	}
	if req.LookerStudioEmbed != "" {
		setting.LookerStudioEmbed = req.LookerStudioEmbed
	}
	if req.EventTrackingConfig != "" {
		setting.EventTrackingConfig = req.EventTrackingConfig
	}

	// Moota / Flip detail
	if req.MootaEndpoint != "" {
		setting.MootaEndpoint = req.MootaEndpoint
	}
	if req.MootaSignatureEnabled != nil {
		setting.MootaSignatureEnabled = *req.MootaSignatureEnabled
	}
	if req.MootaDateRange != nil {
		setting.MootaDateRange = *req.MootaDateRange
	}
	if req.FlipMode != "" {
		setting.FlipMode = req.FlipMode
	}
	if req.FlipAutoRedirect != nil {
		setting.FlipAutoRedirect = *req.FlipAutoRedirect
	}
	if req.FlipChargeFee != "" {
		setting.FlipChargeFee = req.FlipChargeFee
	}

	return s.settingRepo.Update(setting)
}
