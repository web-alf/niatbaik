package service

import (
	"crypto/rand"
	"fmt"
	"math/big"
	"strings"
	"time"

	"github.com/anrdart/niatbaik-api/internal/config"
	"github.com/anrdart/niatbaik-api/internal/dto/request"
	"github.com/anrdart/niatbaik-api/internal/model"
	"github.com/anrdart/niatbaik-api/internal/repository"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type DonationService struct {
	db           *gorm.DB
	cfg          *config.Config
	invoiceRepo  *repository.InvoiceRepo
	campaignRepo *repository.CampaignRepo
	donationRepo *repository.DonationRepo
	settingRepo  *repository.SettingRepo
	flipService  *FlipService
}

func NewDonationService(
	db *gorm.DB,
	cfg *config.Config,
	invoiceRepo *repository.InvoiceRepo,
	campaignRepo *repository.CampaignRepo,
	donationRepo *repository.DonationRepo,
	settingRepo *repository.SettingRepo,
	flipService *FlipService,
) *DonationService {
	return &DonationService{
		db:           db,
		cfg:          cfg,
		invoiceRepo:  invoiceRepo,
		campaignRepo: campaignRepo,
		donationRepo: donationRepo,
		settingRepo:  settingRepo,
		flipService:  flipService,
	}
}

func (s *DonationService) CreateDonation(req *request.CreateDonationRequest, ip string) (*model.Invoice, error) {
	campaign, err := s.campaignRepo.FindBySlug(req.CampaignSlug)
	if err != nil {
		return nil, fmt.Errorf("campaign not found")
	}
	active := campaign.Status == "Berjalan" || campaign.Status == "Running" || campaign.Status == "Published"
	if !active {
		return nil, fmt.Errorf("campaign is not active")
	}

	// Validate donation limits (global + per-campaign).
	if settings, err := s.settingRepo.Get(); err == nil && settings != nil {
		if settings.MinDonationGlobal > 0 && req.Amount < settings.MinDonationGlobal {
			return nil, fmt.Errorf("donasi minimal adalah Rp %d", settings.MinDonationGlobal)
		}
	}
	if campaign.MinDonation > 0 && req.Amount < campaign.MinDonation {
		return nil, fmt.Errorf("donasi minimal untuk program ini adalah Rp %d", campaign.MinDonation)
	}
	if campaign.MaxDonation > 0 && req.Amount > campaign.MaxDonation {
		return nil, fmt.Errorf("donasi maksimal untuk program ini adalah Rp %d", campaign.MaxDonation)
	}

	// Idempotency: reject an identical donation from the same phone within a short
	// window. 60s (was 10s) covers realistic client retries on slow/timed-out
	// requests, which otherwise create duplicate invoices that each credit the
	// campaign independently when paid.
	var recentCount int64
	s.db.Model(&model.Invoice{}).
		Where("campaign_id = ? AND donor_phone = ? AND subtotal = ? AND created_at >= ?",
			campaign.ID, req.DonorPhone, req.Amount, time.Now().Add(-60*time.Second)).
		Count(&recentCount)
	if recentCount > 0 {
		return nil, fmt.Errorf("permintaan donasi serupa baru saja dibuat, mohon tunggu sebentar")
	}

	// Resolve an optional referral code (?ref=<user_id>) to the referring
	// fundraiser. Only a real, fundraiser-role user counts; an unknown/garbage code
	// is ignored (donation still proceeds, just unattributed). Tagging the invoice
	// here is what activates the commission payout in PaymentService.ProcessPayment.
	var referredBy *uuid.UUID
	if req.ReferralCode != "" {
		if refID, err := uuid.Parse(strings.TrimSpace(req.ReferralCode)); err == nil {
			var refUser model.User
			if err := s.db.Select("id", "role").First(&refUser, "id = ?", refID).Error; err == nil {
				// Only a fundraiser earns a referral commission, and never on a
				// donation to a campaign they own — that would let a campaign owner
				// self-deal a commission off their own program's donations. Both
				// conditions must hold for the invoice to be attributed.
				if refUser.Role == "fundraiser" && refUser.ID != campaign.UserID {
					referredBy = &refUser.ID
				}
			}
		}
	}

	// Unique code (1-999) for manual bank transfer to disambiguate mutations.
	var uniqueCode int64 = 0
	method := strings.ToUpper(req.PaymentMethod)
	isGateway := method == "QRIS" || method == "FLIP"
	if !isGateway {
		if nBig, err := rand.Int(rand.Reader, big.NewInt(999)); err == nil {
			uniqueCode = nBig.Int64() + 1
		}
	}
	totalAmount := req.Amount + uniqueCode

	msg := req.Message
	var invoice model.Invoice

	// Create invoice + donation atomically, with invoice-number collision retry.
	txErr := s.db.Transaction(func(tx *gorm.DB) error {
		var lastErr error
		for attempt := 0; attempt < 3; attempt++ {
			invoice = model.Invoice{
				InvoiceNumber: "INV-" + randomAlphanumeric(8),
				CampaignID:    campaign.ID,
				Subtotal:      req.Amount,
				Total:         totalAmount,
				DonorName:     req.DonorName,
				DonorPhone:    req.DonorPhone,
				DonorEmail:    req.DonorEmail,
				Message:       &msg,
				IsAnonymous:   req.IsAnonymous,
				ExpiredAt:     time.Now().Add(24 * time.Hour),
				Status:        "Menunggu Pembayaran",
				IP:            ip,
				ReferredBy:    referredBy,
				UTMSource:     req.UTMSource,
				UTMMedium:     req.UTMMedium,
				UTMCampaign:   req.UTMCampaign,
			}
			lastErr = tx.Create(&invoice).Error
			if lastErr == nil {
				break
			}
			if !strings.Contains(strings.ToLower(lastErr.Error()), "duplicate") &&
				!strings.Contains(strings.ToLower(lastErr.Error()), "unique") {
				return fmt.Errorf("failed to create invoice: %w", lastErr)
			}
		}
		if lastErr != nil {
			return fmt.Errorf("failed to create invoice after retries: %w", lastErr)
		}

		donation := model.Donation{
			InvoiceID:  invoice.ID,
			CampaignID: campaign.ID,
			DonorName:  req.DonorName,
			Amount:     req.Amount,
		}
		if err := tx.Create(&donation).Error; err != nil {
			return fmt.Errorf("failed to create donation: %w", err)
		}
		return nil
	})
	if txErr != nil {
		return nil, txErr
	}

	// Create Flip payment bill only when Flip is enabled + configured.
	if isGateway && s.flipService != nil {
		settings, _ := s.settingRepo.Get()
		flipReady := settings != nil && settings.FlipEnabled
		if flipReady {
			redirectURL := fmt.Sprintf("https://donasi.niatbaik.org/donations/%s", invoice.InvoiceNumber)
			bill, flipErr := s.flipService.CreateBill(&invoice, redirectURL)
			if flipErr == nil && bill != nil {
				invoice.PayCode = fmt.Sprintf("%d", bill.LinkID)
				invoice.QrURL = bill.PaymentURL
				invoice.URLAlternative = bill.LinkURL
				invoice.TypePayment = "Flip"
				_ = s.invoiceRepo.Update(&invoice)
			} else {
				// Flip failed — fall back to manual QRIS/transfer, keep invoice valid.
				invoice.TypePayment = "QRIS Manual"
				_ = s.invoiceRepo.Update(&invoice)
			}
		} else {
			// Flip disabled — manual QRIS. Invoice stays "Menunggu Pembayaran".
			invoice.TypePayment = "QRIS Manual"
			_ = s.invoiceRepo.Update(&invoice)
		}
	}

	invoice.Campaign = *campaign
	return &invoice, nil
}

func (s *DonationService) GetPaymentStatus(invoiceNumber string) (*model.Invoice, error) {
	return s.invoiceRepo.FindByInvoiceNumber(invoiceNumber)
}

func randomAlphanumeric(n int) string {
	const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	var sb strings.Builder
	for i := 0; i < n; i++ {
		idx, _ := rand.Int(rand.Reader, big.NewInt(int64(len(chars))))
		sb.WriteByte(chars[idx.Int64()])
	}
	return sb.String()
}
