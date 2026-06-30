package model

import (
	"time"

	"github.com/google/uuid"
)

type Invoice struct {
	ID              uuid.UUID  `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	InvoiceNumber   string     `gorm:"size:50;uniqueIndex;not null" json:"invoice_number"`
	UserID          *uuid.UUID `gorm:"type:uuid;index" json:"user_id"`
	CampaignID      uuid.UUID  `gorm:"type:uuid;not null;index" json:"campaign_id"`
	PaymentMethodID *uuid.UUID `gorm:"type:uuid;index" json:"payment_method_id"`
	ReferredBy      *uuid.UUID `gorm:"type:uuid;index" json:"referred_by"`

	Subtotal     int64  `gorm:"default:0" json:"subtotal"`
	Total        int64  `gorm:"default:0" json:"total"`
	IsPaid       bool   `gorm:"default:false" json:"is_paid"`
	Status       string `gorm:"size:50;default:'Menunggu Pembayaran'" json:"status"`
	IsAnonymous  bool   `gorm:"default:false" json:"is_anonymous"`

	DonorName  string `gorm:"size:255" json:"donor_name"`
	DonorPhone string `gorm:"size:20" json:"donor_phone"`
	DonorEmail string `gorm:"size:255" json:"donor_email"`
	Message    *string `gorm:"type:text" json:"message"`

	ExpiredAt      time.Time  `json:"expired_at"`
	ReminderSentAt *time.Time `json:"reminder_sent_at"`
	PaidAt         *time.Time `json:"paid_at"`

	TypePayment string `gorm:"size:50" json:"type_payment"`
	Signature   string `gorm:"size:255" json:"signature"`
	GatewayInfo string `gorm:"type:text" json:"gateway_info"`
	PayCode     string `gorm:"size:100" json:"pay_code"`
	QrURL       string `gorm:"type:text" json:"qr_url"`
	URLAlternative string `gorm:"size:500" json:"url_alternative"`

	EvidenceStatus string `gorm:"size:50" json:"evidence_status"`
	EvidenceImage  string `gorm:"size:255" json:"evidence_image"`

	ReferralProcessed bool `gorm:"default:false" json:"referral_processed"`

	PaymentMethodName    string `gorm:"size:100" json:"payment_method_name"`
	PaymentQrcode        string `gorm:"type:text" json:"payment_qrcode"`
	DeeplinkURL          string `gorm:"type:text" json:"deeplink_url"`
	PaymentInstructions  string `gorm:"type:text" json:"payment_instructions"` // JSON string

	IP          string `gorm:"size:45" json:"ip"`
	UTMSource   string `gorm:"size:100" json:"utm_source"`
	UTMMedium   string `gorm:"size:100" json:"utm_medium"`
	UTMCampaign string `gorm:"size:100" json:"utm_campaign"`
	UTMContent  string `gorm:"size:100" json:"utm_content"`
	UTMTerm     string `gorm:"size:100" json:"utm_term"`
	UTMID       string `gorm:"size:100" json:"utm_id"`
	ClickID     string `gorm:"size:255" json:"click_id"`
	CSNote      string `gorm:"type:text" json:"cs_note"`

	// CS contact assigned to this donation at creation time (WhatsApp rotator). Stored
	// on the invoice so the donor sees the SAME number on every screen + after reload,
	// and so admin can see which CS handled which donation. Phone is normalized (digits,
	// leading 0 → 62).
	CSPhone string `gorm:"size:20"  json:"cs_phone"`
	CSName  string `gorm:"size:100" json:"cs_name"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	// Relationships
	User          *User          `gorm:"foreignKey:UserID;constraint:OnDelete:SET NULL" json:"user,omitempty"`
	Campaign      Campaign       `gorm:"foreignKey:CampaignID;constraint:OnDelete:CASCADE" json:"campaign,omitempty"`
	PaymentMethod *PaymentMethod `gorm:"foreignKey:PaymentMethodID;constraint:OnDelete:SET NULL" json:"payment_method,omitempty"`
	Referrer      *User          `gorm:"foreignKey:ReferredBy;constraint:OnDelete:SET NULL" json:"referrer,omitempty"`
	Donations     []Donation     `gorm:"foreignKey:InvoiceID" json:"donations,omitempty"`
}

func (i *Invoice) IsExpired() bool {
	return time.Now().After(i.ExpiredAt)
}
