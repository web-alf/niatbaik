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
	AdminFee       int       `gorm:"default:0" json:"admin_fee"`

	FundraiserCommissionPercent int `gorm:"default:0" json:"fundraiser_commission_percent"`

	// Payment gateway — iPaymu (legacy)
	IpaymuVA           string `gorm:"size:100" json:"ipaymu_va"`
	IpaymuSecret       string `gorm:"size:255" json:"-"`
	IpaymuURL          string `gorm:"size:255" json:"ipaymu_url"`
	IpaymuMerchantCode string `gorm:"size:100" json:"ipaymu_merchant_code"`

	// Payment gateway — Moota (bank mutation)
	MootaAPIKey        string `gorm:"size:255" json:"-"`
	MootaWebhookSecret string `gorm:"size:255" json:"-"`
	MootaEnabled       bool   `gorm:"default:false" json:"moota_enabled"`

	// Payment gateway — Flip (payment + disbursement)
	FlipSecretKey       string `gorm:"size:255" json:"-"`
	FlipValidationToken string `gorm:"size:255" json:"-"`
	FlipBaseURL         string `gorm:"size:255" json:"flip_base_url"`
	FlipEnabled         bool   `gorm:"default:false" json:"flip_enabled"`

	// SMTP
	SMTPHost     string `gorm:"size:255" json:"smtp_host"`
	SMTPEmail    string `gorm:"size:255" json:"smtp_email"`
	SMTPPassword string `gorm:"size:255" json:"-"`
	SMTPSSL      string `gorm:"size:10" json:"smtp_ssl"`
	SMTPPort     int    `gorm:"default:587" json:"smtp_port"`
	SMTPName     string `gorm:"size:255" json:"smtp_name"`

	// WhatsApp
	WhatsappProvider         string `gorm:"size:50" json:"whatsapp_provider"`
	WhatsappToken            string `gorm:"size:255" json:"-"`
	WhatsappTokenStarsender  string `gorm:"size:255" json:"-"`

	// Theme
	PaymentProvider    string `gorm:"size:50" json:"payment_provider"`
	ThemeColor         string `gorm:"size:20" json:"theme_color"`
	ProgressbarColor   string `gorm:"size:20" json:"progressbar_color"`
	ButtonColor        string `gorm:"size:20" json:"button_color"`
	PoweredBy          bool   `gorm:"default:true" json:"powered_by"`
	SocialproofSetting bool   `gorm:"default:false" json:"socialproof_setting"`

	// Messaging
	WhatsappAdmin    string `gorm:"size:20" json:"whatsapp_admin"`
	TelegramBotToken string `gorm:"size:255" json:"-"`
	TelegramChatID   string `gorm:"size:100" json:"telegram_chat_id"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
