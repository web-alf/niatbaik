package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

const (
	GoogleAdsConversionNotAttributed      = "not_attributed"
	GoogleAdsConversionPendingCredentials = "pending_credentials"
	GoogleAdsConversionClientSent         = "client_sent"
	GoogleAdsConversionServerSent         = "server_sent"
	GoogleAdsConversionFailed             = "failed"
)

type Invoice struct {
	ID              uuid.UUID  `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	InvoiceNumber   string     `gorm:"size:50;uniqueIndex;not null" json:"invoice_number"`
	UserID          *uuid.UUID `gorm:"type:uuid;index" json:"user_id"`
	CampaignID      uuid.UUID  `gorm:"type:uuid;not null;index" json:"campaign_id"`
	PaymentMethodID *uuid.UUID `gorm:"type:uuid;index" json:"payment_method_id"`
	ReferredBy      *uuid.UUID `gorm:"type:uuid;index" json:"referred_by"`

	Subtotal    int64  `gorm:"default:0" json:"subtotal"`
	Total       int64  `gorm:"default:0" json:"total"`
	IsPaid      bool   `gorm:"default:false" json:"is_paid"`
	Status      string `gorm:"size:50;default:'Menunggu Pembayaran'" json:"status"`
	IsAnonymous bool   `gorm:"default:false" json:"is_anonymous"`

	DonorName  string  `gorm:"size:255" json:"donor_name"`
	DonorPhone string  `gorm:"size:20" json:"donor_phone"`
	DonorEmail string  `gorm:"size:255" json:"donor_email"`
	Message    *string `gorm:"type:text" json:"message"`

	ExpiredAt      time.Time  `json:"expired_at"`
	ReminderSentAt *time.Time `json:"reminder_sent_at"`
	PaidAt         *time.Time `json:"paid_at"`

	TypePayment    string `gorm:"size:50" json:"type_payment"`
	Signature      string `gorm:"size:255" json:"signature"`
	GatewayInfo    string `gorm:"type:text" json:"gateway_info"`
	PayCode        string `gorm:"size:100" json:"pay_code"`
	QrURL          string `gorm:"type:text" json:"qr_url"`
	URLAlternative string `gorm:"size:500" json:"url_alternative"`

	EvidenceStatus string `gorm:"size:50" json:"evidence_status"`
	EvidenceImage  string `gorm:"size:255" json:"evidence_image"`

	ReferralProcessed bool `gorm:"default:false" json:"referral_processed"`

	// Exact amounts credited to each ledger the moment this invoice was settled, snapshotted
	// so a later paid→unpaid revert can reverse the SAME figures. Recomputing from live
	// settings (admin fee / commission %) would drift if those settings changed between
	// payment and revert. Any of these can legitimately be zero for a settled invoice (e.g.
	// a donation at/below the admin fee credits 0), so they must NOT be used to detect
	// "was this snapshotted?" — that's what PaymentSnapshotted is for.
	CampaignCredited   int64 `gorm:"default:0" json:"campaign_credited"`   // → campaign.TotalRaised (net of fee+commission)
	MasterCredited     int64 `gorm:"default:0" json:"master_credited"`     // → settings.TotalMoney (Total − fee)
	CommissionCredited int64 `gorm:"default:0" json:"commission_credited"` // → referrer bonus_balance
	// True once ProcessPayment has written the *_credited snapshots. Invoices paid BEFORE
	// this column existed are false → ReversePayment best-effort recomputes from live
	// settings for them (the one-time legacy backlog), never for freshly-settled rows.
	PaymentSnapshotted bool `gorm:"default:false" json:"payment_snapshotted"`

	PaymentMethodName   string `gorm:"size:100" json:"payment_method_name"`
	PaymentQrcode       string `gorm:"type:text" json:"payment_qrcode"`
	DeeplinkURL         string `gorm:"type:text" json:"deeplink_url"`
	PaymentInstructions string `gorm:"type:text" json:"payment_instructions"` // JSON string

	IP          string `gorm:"size:45" json:"ip"`
	UTMSource   string `gorm:"size:100" json:"utm_source"`
	UTMMedium   string `gorm:"size:100" json:"utm_medium"`
	UTMCampaign string `gorm:"size:100" json:"utm_campaign"`
	UTMContent  string `gorm:"size:100" json:"utm_content"`
	UTMTerm     string `gorm:"size:100" json:"utm_term"`
	UTMID       string `gorm:"size:100" json:"utm_id"`
	ClickID     string `gorm:"size:255" json:"click_id"`
	// Ad click-IDs + browser cookies captured on the landing page, forwarded to Meta CAPI
	// (fbc/fbp) and TikTok Events API (ttclid/ttp) so a settled donation is attributable to
	// the ad that drove it. Without these the server conversions carry only hashed PII and
	// the dashboards can't tie them to a click.
	Fbclid string `gorm:"size:255" json:"fbclid"`
	Fbp    string `gorm:"size:255" json:"fbp"`
	Ttclid string `gorm:"size:255" json:"ttclid"`
	Ttp    string `gorm:"size:255" json:"ttp"`
	Gclid  string `gorm:"size:255" json:"gclid"`
	// GAClientID is the GA4 client id parsed from the browser _ga cookie (the <id>.<ts>
	// suffix after the GAx.y. prefix). Sent as client_id in the server-side Measurement
	// Protocol purchase so GA4 stitches it to the donor's real web session and can forward
	// the conversion to Google Ads. Empty for donors with no _ga cookie (falls back to the
	// invoice number, which still dedups but lands as a session-less (direct) hit).
	GAClientID                     string     `gorm:"size:100" json:"ga_client_id"`
	GoogleAdsConversionStatus      string     `gorm:"size:32;default:''" json:"google_ads_conversion_status"`
	GoogleAdsConversionAttemptedAt *time.Time `json:"google_ads_conversion_attempted_at"`
	GoogleAdsConversionSentAt      *time.Time `json:"google_ads_conversion_sent_at"`
	GoogleAdsConversionError       string     `gorm:"size:1000" json:"google_ads_conversion_error"`
	CSNote                         string     `gorm:"type:text" json:"cs_note"`

	// LeadQuality is a manual CS/admin tag on the lead (invoice), independent of payment
	// status. Empty = unclassified. Values: "berkualitas" | "invalid".
	LeadQuality string `gorm:"size:20;default:''" json:"lead_quality"`

	// CS contact assigned to this donation at creation time (WhatsApp rotator). Stored
	// on the invoice so the donor sees the SAME number on every screen + after reload,
	// and so admin can see which CS handled which donation. Phone is normalized (digits,
	// leading 0 → 62).
	CSPhone string `gorm:"size:20"  json:"cs_phone"`
	CSName  string `gorm:"size:100" json:"cs_name"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
	// Soft delete: admin/CS "hapus lead" moves the invoice to Trash (30-day retention)
	// instead of dropping the row. gorm.DeletedAt auto-scopes EVERY query that goes through
	// db.Model(&Invoice{}) — list, stats, dashboard, analytics — so a trashed lead vanishes
	// from all of them without touching each query. The Trash view reads it back with
	// Unscoped(). json:"-" keeps the null field off the public/API payload.
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

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
