package service

import (
	"crypto/rand"
	"encoding/json"
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
	"gorm.io/gorm/clause"
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
	mootaService      *MootaService
	xenditService     *XenditService
	ipaymuService     *IpaymuService
	duitkuService     *DuitkuService
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
	mootaService *MootaService,
	xenditService *XenditService,
	ipaymuService *IpaymuService,
	duitkuService *DuitkuService,
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
		mootaService:      mootaService,
		xenditService:     xenditService,
		ipaymuService:     ipaymuService,
		duitkuService:     duitkuService,
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
	if code := strings.TrimSpace(req.ReferralCode); code != "" {
		// The referral code is a username (?ref=<username>); older share links used the raw
		// user UUID, so accept both — try UUID first, then fall back to username lookup.
		var refUser model.User
		var found bool
		if refID, err := uuid.Parse(code); err == nil {
			if err := s.db.Select("id", "role", "fundraiser_enabled").First(&refUser, "id = ?", refID).Error; err == nil {
				found = true
			}
		}
		if !found {
			if err := s.db.Select("id", "role", "fundraiser_enabled").First(&refUser, "username = ?", strings.ToLower(code)).Error; err == nil {
				found = true
			}
		}
		// Only a fundraiser (by role OR the fundraiser-enabled capability) earns a referral
		// commission, and never on a donation to a campaign they own — that would let a
		// campaign owner self-deal a commission off their own program's donations.
		if found && refUser.CanFundraise() && refUser.ID != campaign.UserID {
			referredBy = &refUser.ID
		}
	}

	settingsForPay, _ := s.settingRepo.Get()
	googleCustomer, googleLogin, googleAction, googleEnabled := ResolveGoogleAdsSnapshot(settingsForPay, campaign.ConversionConfig)

	// Assign a CS WhatsApp contact to this donation (rotator). Done server-side + stored on
	// the invoice so the donor sees the SAME number on every screen + after reload, the
	// assignment is load-balanced (round-robin / least-loaded, not per-render random), and
	// admin can see which CS handled which donation.
	// NOTE: in "rotator" mode this increments the counter OUTSIDE the invoice tx, so a rare
	// invoice-create failure burns one rotation slot (next donor skips a number). Accepted:
	// rotation still converges and the alternative (counter inside the tx) couples an
	// unrelated settings row to every donation tx for no real benefit.
	csPhone, csName := s.assignCS(settingsForPay)

	// Resolve the chosen payment method + which GATEWAY settles it. The frontend sends
	// payment_method_id which is either a real payment_methods UUID OR a synthetic id
	// ("flip-qris", "moota-bca", "manual-bank-0"). The synthetic ids fail uuid.Parse, so
	// we ALSO derive the channel key from the prefix and resolve its gateway SERVER-SIDE —
	// the client never dictates routing. The gateway decides the settlement path below.
	var chosenMethod *model.PaymentMethod
	channelKey := ""
	clientGatewayHint := ""
	rawID := strings.TrimSpace(req.PaymentMethodID)
	if rawID != "" {
		if pmID, err := uuid.Parse(rawID); err == nil && s.paymentMethodRepo != nil {
			if pm, err := s.paymentMethodRepo.FindByID(pmID); err == nil {
				chosenMethod = pm
				// A real payment_methods row is a MANUAL bank/e-wallet account the admin
				// added (it carries a bank number, not a hosted-gateway channel). Derive a
				// gateway hint so resolveGateway honors that choice instead of falling
				// through to the FlipEnabled default — which would zero the unique code and
				// silently redirect the donor to Flip, ignoring the account they picked.
				clientGatewayHint = "manual"
				channelKey = "manual"
			}
		} else {
			// Synthetic id: "<gateway>-<channelKey>" or "manual-bank-<i>".
			clientGatewayHint, channelKey = parseSyntheticMethodID(rawID)
		}
	}

	// gateway ∈ {flip, moota, manual}. Resolved from the admin's per-channel routing map
	// (settings.PaymentChannelGateways) with a legacy default; a gateway whose creds are
	// unconfigured falls through to manual. clientGatewayHint is only a tiebreaker for the
	// channel key prefix, never authoritative.
	gateway := s.resolveGateway(settingsForPay, channelKey, clientGatewayHint)

	// Unique code is only added by US for the manual-transfer path (so the credit webhook
	// can disambiguate same-amount transfers). Flip disambiguates on its own side. Moota
	// gateway ALSO adds its OWN unique_code on its hosted page — adding ours too would
	// double-count and break the webhook amount-match — so for Moota we keep Total =
	// Subtotal here and correct it to Moota's returned total after CreatePayment.
	var uniqueCode int64 = 0
	if gateway == "manual" {
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

	// For a manual bank transfer, snapshot the destination account onto the invoice
	// (PaymentInstructions JSON) so the confirmation page shows the exact
	// bank/number/holder/logo + kode unik. Use the donor's CHOSEN account
	// ("manual-bank-N"); fall back to the first configured account when the id is a bare
	// "manual" (no specific pick).
	paymentInstructions := ""
	if gateway == "manual" {
		if bank, instr := manualInstructions(settingsForPay, rawID, uniqueCode); bank != nil {
			paymentMethodName = bank.BankName
			paymentInstructions = instr
		}
	}

	msg := req.Message
	var invoice model.Invoice

	// Create invoice + donation atomically, with invoice-number collision retry.
	txErr := s.db.Transaction(func(tx *gorm.DB) error {
		var lastErr error
		for attempt := 0; attempt < 3; attempt++ {
			invoice = model.Invoice{
				InvoiceNumber:                        "INV-" + randomAlphanumeric(8),
				CampaignID:                           campaign.ID,
				Subtotal:                             req.Amount,
				Total:                                totalAmount,
				DonorName:                            req.DonorName,
				DonorPhone:                           req.DonorPhone,
				DonorEmail:                           req.DonorEmail,
				Message:                              &msg,
				IsAnonymous:                          req.IsAnonymous,
				ExpiredAt:                            time.Now().Add(24 * time.Hour),
				Status:                               "Menunggu Pembayaran",
				IP:                                   ip,
				ReferredBy:                           referredBy,
				PaymentMethodID:                      paymentMethodID,
				PaymentMethodName:                    paymentMethodName,
				PaymentInstructions:                  paymentInstructions,
				CSPhone:                              csPhone,
				CSName:                               csName,
				UTMSource:                            req.UTMSource,
				UTMMedium:                            req.UTMMedium,
				UTMCampaign:                          req.UTMCampaign,
				UTMContent:                           req.UTMContent,
				UTMTerm:                              req.UTMTerm,
				UTMID:                                req.UTMID,
				Fbclid:                               req.Fbclid,
				Fbp:                                  req.Fbp,
				Ttclid:                               req.Ttclid,
				Ttp:                                  req.Ttp,
				GAClientID:                           req.GAClientID,
				Gclid:                                req.Gclid,
				Gbraid:                               req.Gbraid,
				Wbraid:                               req.Wbraid,
				GoogleAdsCustomerIDSnapshot:          googleCustomer,
				GoogleAdsLoginCustomerIDSnapshot:     googleLogin,
				GoogleAdsConversionActionIDSnapshot:  googleAction,
				GoogleAdsServerUploadEnabledSnapshot: googleEnabled,
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

		// Attribute the invoice to the fundraiser's affiliate record for this campaign
		// (invoices_created counts referred donations initiated; invoices_paid is bumped
		// separately when payment settles). Scoped to (user, campaign) so a multi-campaign
		// fundraiser's per-campaign stats stay correct.
		if referredBy != nil {
			if err := tx.Model(&model.Fundraiser{}).
				Where("user_id = ? AND campaign_id = ?", *referredBy, campaign.ID).
				UpdateColumn("invoices_created", gorm.Expr("invoices_created + 1")).Error; err != nil {
				return fmt.Errorf("failed to update fundraiser invoices_created: %w", err)
			}
		}
		return nil
	})
	if txErr != nil {
		return nil, txErr
	}

	redirectURL := fmt.Sprintf("%s/donations/%s", s.cfg.FrontendBaseURL, invoice.InvoiceNumber)

	// Route to the resolved gateway. flip/moota create a hosted page (donor redirected);
	// manual shows the org bank account. Any gateway failure degrades to manual transfer
	// IF a bank account is configured, else the donation is rejected + cleaned up (never
	// persist a dead, unpayable invoice).
	switch gateway {
	case "flip":
		bill, flipErr := s.flipService.CreateBill(&invoice, redirectURL)
		if flipErr == nil && bill != nil {
			invoice.PayCode = fmt.Sprintf("%d", bill.LinkID)
			invoice.QrURL = bill.PaymentURL
			invoice.URLAlternative = bill.LinkURL
			invoice.TypePayment = "Flip"
			if err := s.invoiceRepo.Update(&invoice); err != nil {
				log.Printf("[donation] failed to persist Flip bill details for %s: %v", invoice.InvoiceNumber, err)
			}
		} else if errMsg := s.degradeToManual(&invoice, settingsForPay, "Flip CreateBill", flipErr); errMsg != "" {
			return nil, fmt.Errorf("%s", errMsg)
		}

	case "moota":
		if s.mootaService == nil {
			if errMsg := s.degradeToManual(&invoice, settingsForPay, "Moota gateway unavailable", fmt.Errorf("mootaService nil")); errMsg != "" {
				return nil, fmt.Errorf("%s", errMsg)
			}
			break
		}
		txn, mootaErr := s.mootaService.CreatePayment(&invoice, redirectURL)
		if mootaErr == nil && txn != nil {
			invoice.PayCode = string(txn.Data.TrxID)
			invoice.QrURL = txn.Data.PaymentURL
			invoice.URLAlternative = txn.Data.PaymentURL
			invoice.TypePayment = "Moota"
			// Moota appends its OWN unique_code to disambiguate; adopt Moota's authoritative
			// total so the inbound credit-webhook amount-match settles against the exact sum
			// the donor is actually charged (we deliberately did NOT add our own code above).
			if mt := int64(txn.Data.Total); mt > 0 {
				invoice.Total = mt
			}
			if err := s.invoiceRepo.Update(&invoice); err != nil {
				log.Printf("[donation] failed to persist Moota txn details for %s: %v", invoice.InvoiceNumber, err)
			}
		} else if errMsg := s.degradeToManual(&invoice, settingsForPay, "Moota CreatePayment", mootaErr); errMsg != "" {
			return nil, fmt.Errorf("%s", errMsg)
		}

	case "xendit":
		if s.xenditService == nil {
			if errMsg := s.degradeToManual(&invoice, settingsForPay, "Xendit gateway unavailable", fmt.Errorf("xenditService nil")); errMsg != "" {
				return nil, fmt.Errorf("%s", errMsg)
			}
			break
		}
		xinv, xErr := s.xenditService.CreateInvoice(&invoice, redirectURL)
		if xErr == nil && xinv != nil {
			invoice.PayCode = xinv.ID
			invoice.QrURL = xinv.InvoiceURL
			invoice.URLAlternative = xinv.InvoiceURL
			invoice.TypePayment = "Xendit"
			if err := s.invoiceRepo.Update(&invoice); err != nil {
				log.Printf("[donation] failed to persist Xendit invoice details for %s: %v", invoice.InvoiceNumber, err)
			}
		} else if errMsg := s.degradeToManual(&invoice, settingsForPay, "Xendit CreateInvoice", xErr); errMsg != "" {
			return nil, fmt.Errorf("%s", errMsg)
		}

	case "ipaymu":
		if s.ipaymuService == nil {
			if errMsg := s.degradeToManual(&invoice, settingsForPay, "iPaymu gateway unavailable", fmt.Errorf("ipaymuService nil")); errMsg != "" {
				return nil, fmt.Errorf("%s", errMsg)
			}
			break
		}
		pinv, pErr := s.ipaymuService.CreatePayment(&invoice, redirectURL)
		if pErr == nil && pinv != nil {
			invoice.PayCode = pinv.Data.TrxID
			invoice.QrURL = pinv.Data.URL
			invoice.URLAlternative = pinv.Data.URL
			invoice.TypePayment = "iPaymu"
			if err := s.invoiceRepo.Update(&invoice); err != nil {
				log.Printf("[donation] failed to persist iPaymu payment details for %s: %v", invoice.InvoiceNumber, err)
			}
		} else if errMsg := s.degradeToManual(&invoice, settingsForPay, "iPaymu CreatePayment", pErr); errMsg != "" {
			return nil, fmt.Errorf("%s", errMsg)
		}

	case "duitku":
		if s.duitkuService == nil {
			if errMsg := s.degradeToManual(&invoice, settingsForPay, "Duitku gateway unavailable", fmt.Errorf("duitkuService nil")); errMsg != "" {
				return nil, fmt.Errorf("%s", errMsg)
			}
			break
		}
		dinv, dErr := s.duitkuService.CreatePayment(&invoice, redirectURL)
		if dErr == nil && dinv != nil {
			invoice.PayCode = dinv.Reference
			invoice.QrURL = dinv.PaymentURL
			invoice.URLAlternative = dinv.PaymentURL
			invoice.TypePayment = "Duitku"
			if err := s.invoiceRepo.Update(&invoice); err != nil {
				log.Printf("[donation] failed to persist Duitku payment details for %s: %v", invoice.InvoiceNumber, err)
			}
		} else if errMsg := s.degradeToManual(&invoice, settingsForPay, "Duitku CreatePayment", dErr); errMsg != "" {
			return nil, fmt.Errorf("%s", errMsg)
		}

	default: // "manual"
		if !hasManualPath(settingsForPay) {
			log.Printf("[donation] manual route AND no manual bank configured for %s — rejecting (no payable path)", invoice.InvoiceNumber)
			s.cleanupDeadInvoice(&invoice)
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

// degradeToManual handles a gateway runtime failure: if a manual bank account exists, it
// rewrites the invoice to a manual transfer (adding the unique code the gateway path
// skipped) and returns "". Otherwise it deletes the dead invoice+donation and returns a
// donor-facing error message (caller returns it). Centralizes the UNPAYABLE guard so
// every gateway branch behaves identically.
func (s *DonationService) degradeToManual(invoice *model.Invoice, settings *model.Setting, what string, cause error) string {
	if !hasManualPath(settings) {
		log.Printf("[donation] %s failed for %s AND no manual bank configured — rejecting (no payable path): %v", what, invoice.InvoiceNumber, cause)
		s.cleanupDeadInvoice(invoice)
		return "pembayaran sedang tidak tersedia: gateway gagal dan rekening transfer manual belum dikonfigurasi. Mohon hubungi admin"
	}
	log.Printf("[donation] %s failed for %s, degrading to manual transfer: %v", what, invoice.InvoiceNumber, cause)
	// The gateway path didn't add a unique code; add it now so manual reconciliation matches.
	uc := uniqueCodeFromSettings(settings)
	invoice.Total = invoice.Subtotal + uc
	invoice.TypePayment = "Transfer Manual"
	invoice.PayCode = ""
	invoice.QrURL = ""
	// The donor picked a gateway channel, not a specific manual bank, so snapshot the
	// FIRST configured manual account (bare "manual" → index 0) onto the invoice — else
	// the confirmation page would show a blank destination after a gateway failure.
	if bank, instr := manualInstructions(settings, "manual", uc); bank != nil {
		invoice.PaymentMethodName = bank.BankName
		invoice.PaymentInstructions = instr
	}
	if err := s.invoiceRepo.Update(invoice); err != nil {
		log.Printf("[donation] failed to persist manual fallback for %s: %v", invoice.InvoiceNumber, err)
	}
	return ""
}

// manualInstructions resolves the manual-transfer destination for an invoice and returns
// the chosen ManualBank plus a JSON PaymentInstructions snapshot. rawID may be a specific
// "manual-bank-N" pick or a bare "manual"/empty (→ first configured account). Returns
// (nil, "") when no manual account is configured.
func manualInstructions(settings *model.Setting, rawID string, uniqueCode int64) (*model.ManualBank, string) {
	bank := model.ManualBankBySyntheticID(settings, rawID)
	if bank == nil {
		// Bare "manual" or unparseable index: use the first configured account.
		if banks := model.ParseManualBanks(settings); len(banks) > 0 {
			bank = &banks[0]
		}
	}
	if bank == nil {
		return nil, ""
	}
	instr := map[string]interface{}{
		"type":           "manual_transfer",
		"bank_name":      bank.BankName,
		"account_number": bank.AccountNumber,
		"account_name":   bank.AccountName,
		"logo":           bank.Logo,
		"unique_code":    uniqueCode,
	}
	b, err := json.Marshal(instr)
	if err != nil {
		return bank, ""
	}
	return bank, string(b)
}

// cleanupDeadInvoice removes an invoice + its donation that turned out to be unpayable,
// so a failed-to-route donation never lingers as a stuck "Menunggu Pembayaran" row.
func (s *DonationService) cleanupDeadInvoice(invoice *model.Invoice) {
	if delErr := s.db.Where("invoice_id = ?", invoice.ID).Delete(&model.Donation{}).Error; delErr != nil {
		log.Printf("[donation] cleanup: failed to delete donation for dead invoice %s: %v", invoice.InvoiceNumber, delErr)
	}
	if delErr := s.db.Delete(&model.Invoice{}, "id = ?", invoice.ID).Error; delErr != nil {
		log.Printf("[donation] cleanup: failed to delete dead invoice %s: %v", invoice.InvoiceNumber, delErr)
	}
}

func (s *DonationService) GetPaymentStatus(invoiceNumber string) (*model.Invoice, error) {
	return s.invoiceRepo.FindByInvoiceNumber(invoiceNumber)
}

func acknowledgeGoogleAdsClientDispatch(inv *model.Invoice, now time.Time) error {
	if !inv.IsPaid {
		return fmt.Errorf("invoice belum dibayar")
	}
	if _, value := selectGoogleAdsIdentifier(inv); value == "" {
		return fmt.Errorf("invoice tidak memiliki atribusi Google Ads")
	}
	if inv.GoogleAdsClientAttemptedAt == nil {
		inv.GoogleAdsClientAttemptedAt = &now
	}
	return nil
}

func (s *DonationService) AcknowledgeGoogleAdsClientDispatch(invoiceNumber string) error {
	return s.db.Transaction(func(tx *gorm.DB) error {
		var inv model.Invoice
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
			First(&inv, "invoice_number = ?", invoiceNumber).Error; err != nil {
			return err
		}
		if err := acknowledgeGoogleAdsClientDispatch(&inv, time.Now()); err != nil {
			return err
		}
		return tx.Model(&inv).Updates(map[string]any{
			"google_ads_conversion_status":       inv.GoogleAdsConversionStatus,
			"google_ads_conversion_attempted_at": inv.GoogleAdsConversionAttemptedAt,
		}).Error
	})
}

// csContact is one entry from settings.cs_contacts (admin-managed CS WhatsApp list).
type csContact struct {
	Phone string `json:"phone"`
	Name  string `json:"name"`
}

// normalizeWA strips non-digits and maps a leading 0 → 62 (Indonesia), matching the
// frontend's normalizeWa so a stored cs_phone equals the one used to build the wa.me link
// AND the value least-loaded counts group on.
func normalizeWA(n string) string {
	digits := strings.Map(func(r rune) rune {
		if r >= '0' && r <= '9' {
			return r
		}
		return -1
	}, n)
	switch {
	case digits == "":
		return ""
	case strings.HasPrefix(digits, "62"): // already E.164-ish (e.g. from "+62…")
		return digits
	case strings.HasPrefix(digits, "0"): // local "08…" → "628…"
		return "62" + digits[1:]
	case strings.HasPrefix(digits, "8"): // bare "8…" (common when admin drops the 0) → "628…"
		return "62" + digits
	default:
		return digits
	}
}

// assignCS picks the CS WhatsApp contact for a new donation per the admin-selected
// cs_rotator_mode. Returns normalized phone + display name (both "" when no CS is
// configured — the donor page then just hides the WA button). Never errors: a bad config
// degrades to "no CS", never blocks the donation.
//
//   - "least"   → least-loaded: the contact with the fewest invoices assigned so far.
//   - "rotator" → round-robin via an atomic counter on Setting (race-safe under concurrent
//     donations; clause.Returning reads the post-increment value in one round-trip).
//   - default   → the first configured contact (or whatsapp_admin fallback).
func (s *DonationService) assignCS(settings *model.Setting) (string, string) {
	if settings == nil {
		return "", ""
	}
	var list []csContact
	if settings.CSContacts != "" {
		_ = json.Unmarshal([]byte(settings.CSContacts), &list)
	}
	// Keep only contacts with a usable phone, normalized once.
	contacts := make([]csContact, 0, len(list))
	for _, c := range list {
		if p := normalizeWA(c.Phone); p != "" {
			contacts = append(contacts, csContact{Phone: p, Name: strings.TrimSpace(c.Name)})
		}
	}
	if len(contacts) == 0 {
		// No rotator list — fall back to the single admin number (also normalized).
		return normalizeWA(settings.WhatsappAdmin), ""
	}
	if len(contacts) == 1 {
		return contacts[0].Phone, contacts[0].Name
	}

	switch settings.CSRotatorMode {
	case "least":
		// Edge case (accepted): if an old whatsapp_admin fallback number later gets added to
		// the CS list, historical invoices stamped with it inflate that contact's count. Rare
		// and self-correcting as new donations spread out — not worth a date/mode cutoff.
		best, bestCount := 0, int64(-1)
		for i, c := range contacts {
			var count int64
			if err := s.db.Model(&model.Invoice{}).Where("cs_phone = ?", c.Phone).Count(&count).Error; err != nil {
				continue // counting failed for this one — treat as "no info", keep current best
			}
			if bestCount < 0 || count < bestCount {
				best, bestCount = i, count
			}
		}
		return contacts[best].Phone, contacts[best].Name
	case "rotator":
		// Atomic increment + return the new value in a single statement → race-safe.
		var updated model.Setting
		err := s.db.Model(&updated).
			Clauses(clause.Returning{Columns: []clause.Column{{Name: "cs_rotator_index"}}}).
			Where("id = ?", settings.ID).
			UpdateColumn("cs_rotator_index", gorm.Expr("cs_rotator_index + 1")).Error
		if err == nil {
			// updated holds the POST-increment value; (-1) gives a 0-based cursor.
			idx := int((updated.CSRotatorIndex - 1) % int64(len(contacts)))
			if idx < 0 {
				idx += len(contacts)
			}
			return contacts[idx].Phone, contacts[idx].Name
		}
		// Increment failed (shouldn't happen) — degrade to first contact.
		return contacts[0].Phone, contacts[0].Name
	default:
		return contacts[0].Phone, contacts[0].Name
	}
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
	// A structured ManualBanks list counts even when the legacy single BankNumber is
	// blank — ParseManualBanks covers both shapes plus the org-account fallback.
	return len(model.ParseManualBanks(s)) > 0
}

// channelDefaultGateway is the legacy/unconfigured routing default per channel key,
// honoring the Flip VA-only agreement out of the box: VA channels → flip, QRIS → moota,
// e-wallet → moota (hidden until Moota e-wallet GA via the public list), transfer → manual.
// Mirrors flipChannelCatalog keys in public_handler.go.
var channelDefaultGateway = map[string]string{
	// Virtual Account → Flip
	"bca": "flip", "mandiri": "flip", "bni": "flip", "bri": "flip", "bsi": "flip",
	"muamalat": "flip", "cimb": "flip", "danamon": "flip", "permata": "flip",
	// QRIS + e-wallet → Moota
	"qris": "moota", "gopay": "moota", "ovo": "moota", "dana": "moota",
	"linkaja": "moota", "shopeepay": "moota", "doku": "moota",
	// Bank transfer → Manual
	"flip": "manual", "manual": "manual",
}

// parseSyntheticMethodID splits a donor-facing synthetic payment-method id into a
// (gatewayHint, channelKey). Forms: "flip-qris" → ("flip","qris"); "moota-bca" →
// ("moota","bca"); "manual-bank-0" → ("manual","manual"); anything else → ("","").
func parseSyntheticMethodID(id string) (gatewayHint, channelKey string) {
	id = strings.ToLower(strings.TrimSpace(id))
	switch {
	case strings.HasPrefix(id, "manual-bank-") || id == "manual":
		return "manual", "manual"
	case strings.HasPrefix(id, "flip-"):
		return "flip", strings.TrimPrefix(id, "flip-")
	case strings.HasPrefix(id, "moota-"):
		return "moota", strings.TrimPrefix(id, "moota-")
	case strings.HasPrefix(id, "xendit-"):
		return "xendit", strings.TrimPrefix(id, "xendit-")
	case strings.HasPrefix(id, "ipaymu-"):
		return "ipaymu", strings.TrimPrefix(id, "ipaymu-")
	case strings.HasPrefix(id, "duitku-"):
		return "duitku", strings.TrimPrefix(id, "duitku-")
	}
	return "", ""
}

// resolveGateway is the DonationService entry point: it delegates to the pure
// ResolveChannelGateway and additionally downgrades when the corresponding service isn't
// wired (defensive — both are constructed in the router). clientGatewayHint is used only
// when no channel key was derivable (e.g. a real payment_methods UUID).
func (s *DonationService) resolveGateway(settings *model.Setting, channelKey, clientGatewayHint string) string {
	gw := ResolveChannelGateway(settings, channelKey, clientGatewayHint)
	if gw == "flip" && s.flipService == nil {
		return "manual"
	}
	if gw == "moota" && s.mootaService == nil {
		return "manual"
	}
	if gw == "xendit" && s.xenditService == nil {
		return "manual"
	}
	if gw == "ipaymu" && s.ipaymuService == nil {
		return "manual"
	}
	if gw == "duitku" && s.duitkuService == nil {
		return "manual"
	}
	return gw
}

// ResolveChannelGateway decides which gateway settles a channel, SERVER-SIDE, from
// settings alone (pure — shared by the donation router and the public method list). Order:
//  1. the admin's per-channel map (settings.PaymentChannelGateways) for channelKey;
//  2. else the legacy default map (channelDefaultGateway);
//  3. else fall back to today's global behavior (FlipEnabled → flip, else manual).
//
// Then it DOWNGRADES to "manual" when the resolved gateway's credentials aren't configured
// (Flip secret / Moota gateway account), so the donation never routes to a dead gateway.
// clientGatewayHint is a weak tiebreaker used only when channelKey is empty; never trusted
// over the admin map.
func ResolveChannelGateway(settings *model.Setting, channelKey, clientGatewayHint string) string {
	gw := ""
	if settings != nil && channelKey != "" {
		gw = lookupChannelGateway(settings.PaymentChannelGateways, channelKey)
	}
	if gw == "" && channelKey != "" {
		gw = channelDefaultGateway[channelKey]
	}
	if gw == "" {
		switch clientGatewayHint {
		case "flip", "moota", "manual":
			gw = clientGatewayHint
		default:
			if settings != nil && settings.FlipEnabled {
				gw = "flip"
			} else {
				gw = "manual"
			}
		}
	}

	// Downgrade to a credentialed gateway.
	switch gw {
	case "flip":
		if settings == nil || !settings.FlipEnabled || settings.FlipSecretKey == "" {
			return "manual"
		}
	case "moota":
		if settings == nil || !settings.MootaGatewayEnabled ||
			settings.MootaAPIKey == "" || strings.TrimSpace(settings.MootaGatewayAccountID) == "" {
			return "manual"
		}
	case "xendit":
		if settings == nil || !settings.XenditEnabled || strings.TrimSpace(settings.XenditSecretKey) == "" {
			return "manual"
		}
	case "ipaymu":
		if settings == nil || !settings.IpaymuEnabled ||
			strings.TrimSpace(settings.IpaymuVA) == "" || strings.TrimSpace(settings.IpaymuAPIKey) == "" {
			return "manual"
		}
	case "duitku":
		if settings == nil || !settings.DuitkuEnabled ||
			strings.TrimSpace(settings.DuitkuMerchant) == "" || strings.TrimSpace(settings.DuitkuAPIKey) == "" {
			return "manual"
		}
	}
	return gw
}

// lookupChannelGateway parses the PaymentChannelGateways JSON ({channelKey: gateway}) and
// returns the gateway for key, or "" if absent/unparseable.
func lookupChannelGateway(cfgJSON, key string) string {
	if strings.TrimSpace(cfgJSON) == "" {
		return ""
	}
	var m map[string]string
	if err := json.Unmarshal([]byte(cfgJSON), &m); err != nil {
		return ""
	}
	g := strings.ToLower(strings.TrimSpace(m[key]))
	if g == "flip" || g == "moota" || g == "xendit" || g == "ipaymu" || g == "duitku" || g == "manual" {
		return g
	}
	return ""
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
