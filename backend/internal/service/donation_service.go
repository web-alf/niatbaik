package service

import (
	"crypto/rand"
	"fmt"
	"log"
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
	db                *gorm.DB
	cfg               *config.Config
	invoiceRepo       *repository.InvoiceRepo
	campaignRepo      *repository.CampaignRepo
	donationRepo      *repository.DonationRepo
	settingRepo       *repository.SettingRepo
	paymentMethodRepo *repository.PaymentMethodRepo
	flipService       *FlipService
	paymentSvc        *PaymentService
}

func NewDonationService(
	db *gorm.DB,
	cfg *config.Config,
	invoiceRepo *repository.InvoiceRepo,
	campaignRepo *repository.CampaignRepo,
	donationRepo *repository.DonationRepo,
	settingRepo *repository.SettingRepo,
	paymentMethodRepo *repository.PaymentMethodRepo,
	flipService *FlipService,
	paymentSvc *PaymentService,
) *DonationService {
	return &DonationService{
		db:                db,
		cfg:               cfg,
		invoiceRepo:       invoiceRepo,
		campaignRepo:      campaignRepo,
		donationRepo:      donationRepo,
		settingRepo:       settingRepo,
		paymentMethodRepo: paymentMethodRepo,
		flipService:       flipService,
		paymentSvc:        paymentSvc,
	}
}

func (s *DonationService) CreateDonation(req *request.CreateDonationRequest, ip string) (*model.Invoice, error) {
	campaign, err := s.campaignRepo.FindBySlug(req.CampaignSlug)
	if err != nil {
		return nil, fmt.Errorf("campaign not found")
	}
	active := campaign.Status == "Berjalan" || campaign.Status == "Running" || campaign.Status == "Published"
	if !active {
		return nil, fmt.Errorf("campaign ini sedang tidak menerima donasi (status: %s)", campaign.Status)
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

	// Resolve the chosen payment method. The frontend sends payment_method_id (UUID
	// from /payment-methods/public); fall back to the legacy free-text label. We
	// record the method on the invoice so the admin dashboard and the donor's
	// confirmation page show the real method (bank name / type), and so the right
	// gateway routing is chosen.
	var chosenMethod *model.PaymentMethod
	if req.PaymentMethodID != "" && s.paymentMethodRepo != nil {
		if pmID, err := uuid.Parse(strings.TrimSpace(req.PaymentMethodID)); err == nil {
			if pm, err := s.paymentMethodRepo.FindByID(pmID); err == nil {
				chosenMethod = pm
			}
		}
	}

	// Payment model: Flip is the automatic gateway. When Flip is enabled, every
	// method (QRIS / VA / e-wallet) is settled instantly through Flip and needs NO
	// unique code — the gateway disambiguates each payment itself. Only when Flip is
	// disabled do we fall back to manual bank transfer, where a 1-999 unique code is
	// appended so Moota/manual reconciliation can tell two same-amount transfers apart.
	settingsForPay, _ := s.settingRepo.Get()
	isGateway := settingsForPay != nil && settingsForPay.FlipEnabled && s.flipService != nil // Flip-auto

	var uniqueCode int64 = 0
	if !isGateway {
		uniqueCode = uniqueCodeFromSettings(settingsForPay)
	}
	totalAmount := req.Amount + uniqueCode

	// Name + FK recorded on the invoice for display/reporting/admin dashboard.
	paymentMethodName := req.PaymentMethod
	var paymentMethodID *uuid.UUID
	if chosenMethod != nil {
		paymentMethodName = chosenMethod.BankName
		paymentMethodID = &chosenMethod.ID
	}

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
				ExpiredAt:         time.Now().Add(24 * time.Hour),
				Status:            "Menunggu Pembayaran",
				IP:                ip,
				ReferredBy:        referredBy,
				PaymentMethodID:   paymentMethodID,
				PaymentMethodName: paymentMethodName,
				UTMSource:         req.UTMSource,
				UTMMedium:         req.UTMMedium,
				UTMCampaign:       req.UTMCampaign,
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

	// When Flip is the active gateway, create the hosted bill so the donor is sent to
	// Flip's payment page (QRIS/VA/e-wallet, settled via webhook). The redirect host
	// is configurable (FRONTEND_BASE_URL) instead of hardcoded to production.
	if isGateway {
		redirectURL := fmt.Sprintf("%s/donations/%s", s.cfg.FrontendBaseURL, invoice.InvoiceNumber)
		bill, flipErr := s.flipService.CreateBill(&invoice, redirectURL)
		if flipErr == nil && bill != nil {
			invoice.PayCode = fmt.Sprintf("%d", bill.LinkID)
			invoice.QrURL = bill.PaymentURL
			invoice.URLAlternative = bill.LinkURL
			invoice.TypePayment = "Flip"
			if err := s.invoiceRepo.Update(&invoice); err != nil {
				log.Printf("[donation] failed to persist Flip bill details for %s: %v", invoice.InvoiceNumber, err)
			}
		} else {
			// Flip call failed at runtime — degrade to a manual transfer so the invoice
			// stays payable. But ONLY if a manual bank account is actually configured: a
			// fallback with no bank number, no QR, and (when unique=none) no reconciliation
			// key is an UNPAYABLE dead invoice — the exact prod bug where donors saw a
			// "transfer manual" page with nowhere to transfer. Fail loudly + clean up
			// instead of persisting a dead invoice and silently losing the donation.
			if !hasManualPath(settingsForPay) {
				log.Printf("[donation] Flip CreateBill failed for %s AND no manual bank configured — rejecting (no payable path): %v", invoice.InvoiceNumber, flipErr)
				if delErr := s.db.Where("invoice_id = ?", invoice.ID).Delete(&model.Donation{}).Error; delErr != nil {
					log.Printf("[donation] cleanup: failed to delete donation for dead invoice %s: %v", invoice.InvoiceNumber, delErr)
				}
				if delErr := s.db.Delete(&model.Invoice{}, "id = ?", invoice.ID).Error; delErr != nil {
					log.Printf("[donation] cleanup: failed to delete dead invoice %s: %v", invoice.InvoiceNumber, delErr)
				}
				return nil, fmt.Errorf("pembayaran sedang tidak tersedia: gateway gagal dan rekening transfer manual belum dikonfigurasi. Mohon hubungi admin")
			}
			// Add a unique code now (it wasn't added above because we expected the gateway
			// to disambiguate) so manual reconciliation can match it.
			log.Printf("[donation] Flip CreateBill failed for %s, degrading to manual transfer: %v", invoice.InvoiceNumber, flipErr)
			invoice.Total = invoice.Subtotal + uniqueCodeFromSettings(settingsForPay)
			invoice.TypePayment = "Transfer Manual"
			if err := s.invoiceRepo.Update(&invoice); err != nil {
				log.Printf("[donation] failed to persist manual fallback for %s: %v", invoice.InvoiceNumber, err)
			}
		}
	} else {
		// Flip disabled — manual bank transfer. Guard the same way: with no bank account
		// configured there is no destination to transfer to, so the donation is unpayable.
		if !hasManualPath(settingsForPay) {
			log.Printf("[donation] Flip disabled AND no manual bank configured for %s — rejecting (no payable path)", invoice.InvoiceNumber)
			if delErr := s.db.Where("invoice_id = ?", invoice.ID).Delete(&model.Donation{}).Error; delErr != nil {
				log.Printf("[donation] cleanup: failed to delete donation for dead invoice %s: %v", invoice.InvoiceNumber, delErr)
			}
			if delErr := s.db.Delete(&model.Invoice{}, "id = ?", invoice.ID).Error; delErr != nil {
				log.Printf("[donation] cleanup: failed to delete dead invoice %s: %v", invoice.InvoiceNumber, delErr)
			}
			return nil, fmt.Errorf("pembayaran sedang tidak tersedia: belum ada metode pembayaran yang aktif. Mohon hubungi admin")
		}
		invoice.TypePayment = "Transfer Manual"
		if err := s.invoiceRepo.Update(&invoice); err != nil {
			log.Printf("[donation] failed to persist manual transfer type for %s: %v", invoice.InvoiceNumber, err)
		}
	}

	invoice.Campaign = *campaign
	return &invoice, nil
}

func (s *DonationService) GetPaymentStatus(invoiceNumber string) (*model.Invoice, error) {
	return s.invoiceRepo.FindByInvoiceNumber(invoiceNumber)
}

// SimulatePayment settles an invoice WITHOUT a real gateway/bank transfer, for testers
// trying the donation flow in a non-production environment. It is the missing "continue"
// action for QRIS / VA / manual methods, which (unlike Flip's hosted link) have no way to
// advance to a paid state during testing.
//
// SECURITY: hard-gated to non-production. In production this is a no-op error — it must
// NEVER be possible to mark a donation paid without real money. The route is also only
// registered when AppEnv != production (defense in depth), but we re-check here so the
// service can't be misused even if the route guard regresses.
func (s *DonationService) SimulatePayment(invoiceNumber string) (*model.Invoice, error) {
	if s.cfg != nil && s.cfg.IsProduction() {
		return nil, fmt.Errorf("simulasi pembayaran dinonaktifkan di production")
	}
	inv, err := s.invoiceRepo.FindUnpaidByInvoiceNumber(invoiceNumber)
	if err != nil || inv == nil {
		// Either not found or already paid — for a sandbox tester both are non-fatal.
		existing, ferr := s.invoiceRepo.FindByInvoiceNumber(invoiceNumber)
		if ferr == nil && existing != nil && existing.IsPaid {
			return existing, nil // already settled; idempotent success
		}
		return nil, fmt.Errorf("invoice tidak ditemukan atau sudah dibayar")
	}
	if err := s.paymentSvc.ProcessPayment(inv); err != nil {
		return nil, err
	}
	return s.invoiceRepo.FindByInvoiceNumber(invoiceNumber)
}

// hasManualPath reports whether a manual bank-transfer destination is actually
// configured. The ONLY thing a donor strictly needs to pay is the account NUMBER to
// transfer to — the bank label (BankName) and holder (BankAccountName) are display-only
// and both have safe frontend fallbacks ("Transfer Bank" / "Yayasan Niat Baik"). The
// donor confirmation page itself gates the manual-transfer view on bank_number alone, so
// requiring BankName here would (and did) wrongly reject a perfectly payable config where
// the admin filled the account number but left the bank-label field blank. Match the
// frontend: a non-empty account number means the donation IS payable via Moota reconcile.
func hasManualPath(s *model.Setting) bool {
	if s == nil {
		return false
	}
	return strings.TrimSpace(s.BankNumber) != ""
}

// uniqueCodeFromSettings derives the manual-transfer unique code from the admin's
// "Kode Unik" config: none → 0, fixed → the configured number, range → a random
// value in [min,max]. Falls back to the legacy 1–999 range when settings are nil or
// the mode/range is invalid, so reconciliation still works.
func uniqueCodeFromSettings(s *model.Setting) int64 {
	if s == nil {
		if n, err := rand.Int(rand.Reader, big.NewInt(999)); err == nil {
			return n.Int64() + 1
		}
		return 0
	}
	switch strings.ToLower(strings.TrimSpace(s.UniqueCodeMode)) {
	case "none":
		return 0
	case "fixed":
		if s.UniqueCodeFixed < 0 {
			return 0
		}
		return int64(s.UniqueCodeFixed)
	default: // "range" (or unset)
		lo, hi := s.UniqueCodeMin, s.UniqueCodeMax
		if lo <= 0 {
			lo = 1
		}
		if hi < lo {
			hi = 999
			if lo > hi {
				lo = 1
			}
		}
		span := int64(hi - lo + 1)
		if n, err := rand.Int(rand.Reader, big.NewInt(span)); err == nil {
			return int64(lo) + n.Int64()
		}
		return int64(lo)
	}
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
