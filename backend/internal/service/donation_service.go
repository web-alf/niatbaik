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
	if campaign.Status != "Berjalan" {
		return nil, fmt.Errorf("campaign is not active")
	}

	invoiceNumber := "INV-" + randomAlphanumeric(8)

	msg := req.Message

	invoice := model.Invoice{
		InvoiceNumber: invoiceNumber,
		CampaignID:    campaign.ID,
		Subtotal:      req.Amount,
		Total:         req.Amount,
		DonorName:     req.DonorName,
		DonorPhone:    req.DonorPhone,
		DonorEmail:    req.DonorEmail,
		Message:       &msg,
		IsAnonymous:   req.IsAnonymous,
		ExpiredAt:     time.Now().Add(24 * time.Hour),
		Status:        "Menunggu Pembayaran",
		IP:            ip,
		UTMSource:     req.UTMSource,
		UTMMedium:     req.UTMMedium,
		UTMCampaign:   req.UTMCampaign,
	}

	if err := s.invoiceRepo.Create(&invoice); err != nil {
		return nil, fmt.Errorf("failed to create invoice: %w", err)
	}

	donation := model.Donation{
		InvoiceID:  invoice.ID,
		CampaignID: campaign.ID,
		DonorName:  req.DonorName,
		Amount:     req.Amount,
	}
	if err := s.donationRepo.Create(&donation); err != nil {
		return nil, fmt.Errorf("failed to create donation: %w", err)
	}

	// Create Flip payment bill if configured
	if s.flipService != nil && s.cfg.FlipSecretKey != "" {
		redirectURL := fmt.Sprintf("https://donasi.niatbaik.org/donations/%s", invoice.InvoiceNumber)
		bill, err := s.flipService.CreateBill(&invoice, redirectURL)
		if err == nil && bill != nil {
			invoice.PayCode = fmt.Sprintf("%d", bill.LinkID)
			invoice.QrURL = bill.PaymentURL
			invoice.URLAlternative = bill.LinkURL
			invoice.TypePayment = "Flip"
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
