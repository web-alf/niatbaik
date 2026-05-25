package service

import (
	"github.com/anrdart/niatbaik-api/internal/dto/request"
	"github.com/anrdart/niatbaik-api/internal/model"
	"github.com/anrdart/niatbaik-api/internal/repository"
)

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
	if req.PaymentProvider != "" {
		setting.PaymentProvider = req.PaymentProvider
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
	if req.SocialProofEnabled != nil {
		setting.SocialProofEnabled = *req.SocialProofEnabled
	}
	if req.SocialProofConfig != "" {
		setting.SocialProofConfig = req.SocialProofConfig
	}

	return s.settingRepo.Update(setting)
}
