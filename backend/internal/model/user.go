package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type User struct {
	ID                 uuid.UUID      `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Name               string         `gorm:"size:255;not null" json:"name"`
	Email              string         `gorm:"size:255;uniqueIndex;not null" json:"email"`
	Phone              *string        `gorm:"size:20;uniqueIndex" json:"phone"`
	EmailVerifiedAt    *time.Time     `json:"email_verified_at"`
	LastLoginAt        *time.Time     `gorm:"index" json:"last_login_at"` // updated on each successful login
	Password           string         `gorm:"size:255;not null" json:"-"`
	Role               string         `gorm:"size:20;not null;default:'user'" json:"role"` // admin, cs, advertiser, user, fundraiser
	ForcePasswordReset bool           `gorm:"default:false" json:"force_password_reset"`
	Image              string         `gorm:"size:255" json:"image"`
	UserCoverImage     string         `gorm:"size:255" json:"user_cover_image"`
	Address            string         `gorm:"size:500" json:"address"`
	Bio                string         `gorm:"type:text" json:"bio"`

	// Organization fields
	OrgStatus  string `gorm:"size:20" json:"org_status"`
	OrgName    string `gorm:"size:255" json:"org_name"`
	OrgPhone   string `gorm:"size:20" json:"org_phone"`
	OrgAddress string `gorm:"size:500" json:"org_address"`
	OrgImage   string `gorm:"size:255" json:"org_image"`

	// Bank fields
	BankType   string `gorm:"size:50" json:"bank_type"`
	BankNumber string `gorm:"size:50" json:"bank_number"`
	BankName   string `gorm:"size:100" json:"bank_name"`

	// Fundraiser fields
	FundName       string `gorm:"size:255" json:"fund_name"`
	FundEmail      string `gorm:"size:255" json:"fund_email"`
	FundWhatsapp   string `gorm:"size:20" json:"fund_whatsapp"`
	FundProvince   string `gorm:"size:100" json:"fund_province"`
	FundBankName   string `gorm:"size:100" json:"fund_bank_name"`
	FundBankNumber string `gorm:"size:50" json:"fund_bank_number"`
	FundBankType   string `gorm:"size:50" json:"fund_bank_type"`
	FundOrg        string `gorm:"size:255" json:"fund_org"`

	// Password reset
	ResetToken       string     `gorm:"size:255" json:"-"`
	ResetTokenExpiry *time.Time `json:"-"`

	// Referral / bonus
	BonusBalance  int64  `gorm:"default:0" json:"bonus_balance"`
	BonusWithdrawn int64 `gorm:"default:0" json:"bonus_withdrawn"`
	TotalClicks   int    `gorm:"default:0" json:"total_clicks"`
	ReferredBy    *uuid.UUID `gorm:"type:uuid" json:"referred_by"`

	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	// Relationships
	Referrer           *User              `gorm:"foreignKey:ReferredBy;constraint:OnDelete:SET NULL" json:"referrer,omitempty"`
	Campaigns          []Campaign         `gorm:"foreignKey:UserID" json:"campaigns,omitempty"`
	Invoices           []Invoice          `gorm:"foreignKey:UserID" json:"invoices,omitempty"`
	Withdrawals        []Withdrawal       `gorm:"foreignKey:UserID" json:"withdrawals,omitempty"`
	LoginHistories     []LoginHistory     `gorm:"foreignKey:UserID" json:"login_histories,omitempty"`
}

func (u *User) IsAdmin() bool       { return u.Role == "admin" }
func (u *User) IsCS() bool          { return u.Role == "cs" }
func (u *User) IsAdvertiser() bool  { return u.Role == "advertiser" }
func (u *User) IsFundraiser() bool  { return u.Role == "fundraiser" }
