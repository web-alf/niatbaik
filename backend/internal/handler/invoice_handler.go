package handler

import (
	"bytes"
	"encoding/csv"
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/anrdart/niatbaik-api/internal/dto/request"
	"github.com/anrdart/niatbaik-api/internal/dto/response"
	"github.com/anrdart/niatbaik-api/internal/model"
	"github.com/anrdart/niatbaik-api/internal/repository"
	"github.com/anrdart/niatbaik-api/internal/service"
	"github.com/anrdart/niatbaik-api/pkg/pagination"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

type InvoiceHandler struct {
	db             *gorm.DB
	paymentService *service.PaymentService
	statusRepo     *repository.PaymentStatusRepo
	invoiceRepo    *repository.InvoiceRepo
	settingRepo    *repository.SettingRepo
	signaler       service.ConversionSignaler
}

func NewInvoiceHandler(db *gorm.DB, paymentService *service.PaymentService, statusRepo *repository.PaymentStatusRepo, deps ...any) *InvoiceHandler {
	h := &InvoiceHandler{db: db, paymentService: paymentService, statusRepo: statusRepo}
	for _, dep := range deps {
		switch v := dep.(type) {
		case *repository.InvoiceRepo:
			h.invoiceRepo = v
		case *repository.SettingRepo:
			h.settingRepo = v
		case service.ConversionSignaler:
			h.signaler = v
		}
	}
	return h
}

func applyInvoiceFilters(query *gorm.DB, c echo.Context) *gorm.DB {
	// Filter by status
	if status := c.QueryParam("status"); status != "" {
		query = query.Where("status = ?", status)
	}

	// Filter by payment method
	if method := c.QueryParam("payment_method"); method != "" {
		query = query.Where("payment_method_name = ?", method)
	}

	// Filter by campaign (leads-per-campaign view)
	if cid := c.QueryParam("campaign_id"); cid != "" {
		if id, err := uuid.Parse(cid); err == nil {
			query = query.Where("campaign_id = ?", id)
		}
	}

	// Filter by date range
	if from := c.QueryParam("from"); from != "" {
		if t, err := time.Parse("2006-01-02", from); err == nil {
			query = query.Where("created_at >= ?", t)
		}
	}
	if to := c.QueryParam("to"); to != "" {
		if t, err := time.Parse("2006-01-02", to); err == nil {
			query = query.Where("created_at < ?", t.AddDate(0, 0, 1))
		}
	}

	// Search by donor name or invoice number
	if search := c.QueryParam("search"); search != "" {
		like := "%" + search + "%"
		query = query.Where("donor_name ILIKE ? OR invoice_number ILIKE ?", like, like)
	}
	return query
}

func (h *InvoiceHandler) List(c echo.Context) error {
	params := pagination.GetPaginationParams(c)
	query := applyInvoiceFilters(h.db.Model(&model.Invoice{}), c)

	var total int64
	if err := query.Count(&total).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, response.ErrorResponse("failed to count invoices"))
	}

	var invoices []model.Invoice
	err := pagination.ApplyPagination(query, params).
		Preload("Campaign").
		Preload("PaymentMethod").
		Preload("Referrer").
		Find(&invoices).Error
	if err != nil {
		return c.JSON(http.StatusInternalServerError, response.ErrorResponse("failed to fetch invoices"))
	}

	p := pagination.Paginate(params, total)
	return c.JSON(http.StatusOK, response.PaginatedResponse(response.ToInvoiceListResponse(invoices), p))
}

var invoiceCSVHeader = []string{
	"invoice", "tanggal", "donatur", "campaign", "nominal", "metode", "status",
	"fundraiser", "whatsapp", "email", "utm_source", "utm_medium", "utm_campaign",
	"utm_content", "utm_term", "utm_id", "pesan", "note", "gclid", "ga_client_id",
	"google_ads_conversion_status", "google_ads_conversion_attempted_at",
	"google_ads_conversion_sent_at", "google_ads_conversion_error", "gbraid", "wbraid",
	"google_ads_customer_id", "google_ads_conversion_action_id", "google_ads_client_attempted_at",
	"google_ads_server_status", "google_ads_server_attempted_at", "google_ads_server_sent_at", "google_ads_server_error",
}

func spreadsheetSafe(value string) string {
	if value == "" {
		return ""
	}
	switch value[0] {
	case '=', '+', '-', '@':
		return "'" + value
	default:
		return value
	}
}

func csvTime(t *time.Time) string {
	if t == nil {
		return ""
	}
	return t.UTC().Format(time.RFC3339)
}

func invoiceCSVRecord(inv model.Invoice) []string {
	message := ""
	if inv.Message != nil {
		message = *inv.Message
	}
	campaign, fundraiser := inv.Campaign.Title, ""
	if inv.Referrer != nil {
		fundraiser = inv.Referrer.Name
	}
	return []string{
		spreadsheetSafe(inv.InvoiceNumber), inv.CreatedAt.UTC().Format(time.RFC3339),
		spreadsheetSafe(inv.DonorName), spreadsheetSafe(campaign), strconv.FormatInt(inv.Total, 10),
		spreadsheetSafe(inv.PaymentMethodName), spreadsheetSafe(inv.Status), spreadsheetSafe(fundraiser),
		spreadsheetSafe(inv.DonorPhone), spreadsheetSafe(inv.DonorEmail), spreadsheetSafe(inv.UTMSource),
		spreadsheetSafe(inv.UTMMedium), spreadsheetSafe(inv.UTMCampaign), spreadsheetSafe(inv.UTMContent),
		spreadsheetSafe(inv.UTMTerm), spreadsheetSafe(inv.UTMID), spreadsheetSafe(message),
		spreadsheetSafe(inv.CSNote), spreadsheetSafe(inv.Gclid), spreadsheetSafe(inv.GAClientID),
		spreadsheetSafe(inv.GoogleAdsConversionStatus), csvTime(inv.GoogleAdsConversionAttemptedAt),
		csvTime(inv.GoogleAdsConversionSentAt), spreadsheetSafe(inv.GoogleAdsConversionError), spreadsheetSafe(inv.Gbraid), spreadsheetSafe(inv.Wbraid),
		spreadsheetSafe(inv.GoogleAdsCustomerIDSnapshot), spreadsheetSafe(inv.GoogleAdsConversionActionIDSnapshot), csvTime(inv.GoogleAdsClientAttemptedAt),
		spreadsheetSafe(inv.GoogleAdsServerStatus), csvTime(inv.GoogleAdsServerAttemptedAt), csvTime(inv.GoogleAdsServerSentAt), spreadsheetSafe(service.SafeGoogleAdsSummary(inv.GoogleAdsServerError)),
	}
}

func (h *InvoiceHandler) Export(c echo.Context) error {
	var invoices []model.Invoice
	query := applyInvoiceFilters(h.db.Model(&model.Invoice{}), c).
		Preload("Campaign").Preload("PaymentMethod").Preload("Referrer").
		Order(pagination.SanitizeSort(c.QueryParam("sort")))
	if err := query.Find(&invoices).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, response.ErrorResponse("failed to export invoices"))
	}

	var buf bytes.Buffer
	w := csv.NewWriter(&buf)
	if err := w.Write(invoiceCSVHeader); err != nil {
		return c.JSON(http.StatusInternalServerError, response.ErrorResponse("failed to create export"))
	}
	for i := range invoices {
		if err := w.Write(invoiceCSVRecord(invoices[i])); err != nil {
			return c.JSON(http.StatusInternalServerError, response.ErrorResponse("failed to create export"))
		}
	}
	w.Flush()
	if err := w.Error(); err != nil {
		return c.JSON(http.StatusInternalServerError, response.ErrorResponse("failed to create export"))
	}
	c.Response().Header().Set(echo.HeaderContentType, "text/csv; charset=utf-8")
	c.Response().Header().Set(echo.HeaderContentDisposition, fmt.Sprintf(`attachment; filename="niatbaik_transaksi_%s.csv"`, time.Now().Format("2006-01-02")))
	return c.Blob(http.StatusOK, "text/csv; charset=utf-8", buf.Bytes())
}

func (h *InvoiceHandler) GetDetail(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, response.ErrorResponse("invalid invoice id"))
	}

	var invoice model.Invoice
	err = h.db.Preload("Campaign").
		Preload("PaymentMethod").
		Preload("User").
		Preload("Referrer").
		Preload("Donations").
		First(&invoice, "id = ?", id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return c.JSON(http.StatusNotFound, response.ErrorResponse("invoice not found"))
		}
		return c.JSON(http.StatusInternalServerError, response.ErrorResponse("failed to fetch invoice"))
	}

	return c.JSON(http.StatusOK, response.SuccessResponse(response.ToInvoiceResponse(&invoice), "success"))
}

func (h *InvoiceHandler) RetryGoogleAds(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, response.ErrorResponse("invalid invoice id"))
	}
	var inv model.Invoice
	if err := h.db.Preload("Campaign").First(&inv, "id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return c.JSON(http.StatusNotFound, response.ErrorResponse("invoice not found"))
		}
		return c.JSON(http.StatusInternalServerError, response.ErrorResponse("failed to fetch invoice"))
	}
	if !inv.IsPaid {
		return c.JSON(http.StatusUnprocessableEntity, response.ErrorResponse("invoice belum dibayar"))
	}
	if inv.GoogleAdsServerStatus == model.GoogleAdsConversionServerSent || inv.GoogleAdsServerStatus == model.GoogleAdsConversionAcceptedUntracked {
		return c.JSON(http.StatusUnprocessableEntity, response.ErrorResponse("conversion tidak dapat dikirim ulang"))
	}
	if inv.Gclid == "" && inv.Gbraid == "" && inv.Wbraid == "" {
		return c.JSON(http.StatusUnprocessableEntity, response.ErrorResponse("invoice tidak memiliki atribusi Google"))
	}
	setting, err := h.settingRepo.Get()
	if err != nil {
		return c.JSON(http.StatusInternalServerError, response.ErrorResponse("failed to fetch settings"))
	}
	customer, login, action, enabled := service.ResolveGoogleAdsSnapshot(setting, inv.Campaign.ConversionConfig)
	if !enabled || customer == "" || action == "" {
		return c.JSON(http.StatusUnprocessableEntity, response.ErrorResponse("konfigurasi Google Ads belum lengkap"))
	}
	if err := h.invoiceRepo.RetryGoogleAdsInvoice(c.Request().Context(), id, repository.GoogleAdsSnapshot{CustomerID: customer, LoginCustomerID: login, ConversionActionID: action, Enabled: enabled}, time.Now()); err != nil {
		return c.JSON(http.StatusConflict, response.ErrorResponse("invoice tidak dapat diantrekan"))
	}
	if h.signaler != nil {
		h.signaler.Signal()
	}
	return c.JSON(http.StatusOK, response.SuccessResponse(nil, "conversion queued"))
}

func (h *InvoiceHandler) UpdateStatus(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, response.ErrorResponse("invalid invoice id"))
	}

	var req request.UpdateInvoiceStatusRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, response.ErrorResponse("invalid request body"))
	}
	if req.Status == "" {
		return c.JSON(http.StatusBadRequest, response.ErrorResponse("status wajib diisi"))
	}

	// Validate the requested status against the admin-managed master list, and learn
	// whether it counts as "paid" — replacing the old hardcoded oneof + string checks.
	ps, err := h.statusRepo.FindByCode(req.Status)
	if err != nil {
		return c.JSON(http.StatusUnprocessableEntity, response.ErrorResponse("status pembayaran tidak dikenal"))
	}

	var invoice model.Invoice
	// Preload Campaign so an admin marking this invoice paid still gets per-campaign
	// server-side conversion dispatch (SendConversions reads inv.Campaign for the
	// campaign's own pixel/token); without it the campaign would be zero-valued.
	if err := h.db.Preload("Campaign").First(&invoice, "id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return c.JSON(http.StatusNotFound, response.ErrorResponse("invoice not found"))
		}
		return c.JSON(http.StatusInternalServerError, response.ErrorResponse("failed to fetch invoice"))
	}

	// A status flagged is_paid must run the full bookkeeping flow (campaign balance,
	// global balance, fundraiser commission, mutation records). ProcessPayment is
	// idempotent thanks to its locking guard. ProcessPayment forces status to
	// "Terbayar", so honor the admin's chosen label afterward if it differs.
	if ps.IsPaid {
		if !invoice.IsPaid {
			if err := h.paymentService.ProcessPayment(&invoice); err != nil {
				return c.JSON(http.StatusInternalServerError, response.ErrorResponse("failed to process payment"))
			}
		}
		if req.Status != invoice.Status {
			if err := h.db.Model(&model.Invoice{}).Where("id = ?", id).Update("status", req.Status).Error; err != nil {
				return c.JSON(http.StatusInternalServerError, response.ErrorResponse("failed to update status"))
			}
		}
		return c.JSON(http.StatusOK, response.SuccessResponse(nil, "invoice status updated"))
	}

	// Target status is NOT paid. If the invoice was previously settled, run the full
	// reversal so the campaign balance, foundation balance, fundraiser counters and
	// commission are all decremented by exactly what the payment credited (a
	// locked, idempotent transaction). ReversePayment refuses if the funds were already
	// disbursed via a withdrawal — surface that to the caller instead of corrupting balances.
	if invoice.IsPaid {
		if err := h.paymentService.ReversePayment(&invoice, req.Status); err != nil {
			return c.JSON(http.StatusUnprocessableEntity, response.ErrorResponse(err.Error()))
		}
		return c.JSON(http.StatusOK, response.SuccessResponse(nil, "invoice status updated"))
	}

	// Never was paid — just relabel the status (no bookkeeping was ever applied).
	if err := h.db.Model(&invoice).Updates(map[string]any{"status": req.Status}).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, response.ErrorResponse("failed to update status"))
	}
	return c.JSON(http.StatusOK, response.SuccessResponse(nil, "invoice status updated"))
}

func (h *InvoiceHandler) AddNote(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, response.ErrorResponse("invalid invoice id"))
	}

	var req request.AddInvoiceNoteRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, response.ErrorResponse("invalid request body"))
	}
	if err := c.Validate(req); err != nil {
		return c.JSON(http.StatusBadRequest, response.ErrorResponse(response.ValidationMessage(err)))
	}

	result := h.db.Model(&model.Invoice{}).Where("id = ?", id).
		Update("cs_note", req.Note)
	if result.Error != nil {
		return c.JSON(http.StatusInternalServerError, response.ErrorResponse("failed to add note"))
	}
	if result.RowsAffected == 0 {
		return c.JSON(http.StatusNotFound, response.ErrorResponse("invoice not found"))
	}

	return c.JSON(http.StatusOK, response.SuccessResponse(nil, "note added"))
}

// UpdateQuality sets the manual lead-quality tag (berkualitas/invalid, or empty to clear)
// on an invoice. Single-column write; does not touch payment/bookkeeping state.
func (h *InvoiceHandler) UpdateQuality(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, response.ErrorResponse("invalid invoice id"))
	}

	var req request.UpdateInvoiceQualityRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, response.ErrorResponse("invalid request body"))
	}
	if err := c.Validate(req); err != nil {
		return c.JSON(http.StatusBadRequest, response.ErrorResponse(response.ValidationMessage(err)))
	}

	result := h.db.Model(&model.Invoice{}).Where("id = ?", id).
		Update("lead_quality", req.Quality)
	if result.Error != nil {
		return c.JSON(http.StatusInternalServerError, response.ErrorResponse("failed to update quality"))
	}
	if result.RowsAffected == 0 {
		return c.JSON(http.StatusNotFound, response.ErrorResponse("invoice not found"))
	}

	return c.JSON(http.StatusOK, response.SuccessResponse(nil, "lead quality updated"))
}

// Delete soft-deletes a lead (invoice) into Trash (30-day retention). If the lead was
// already PAID, its bookkeeping is reversed FIRST (campaign balance, foundation balance,
// fundraiser commission — same locked/idempotent path as un-paying it) so deleting a paid
// lead never leaves credited funds behind. ReversePayment refuses when the funds were
// already disbursed via a withdrawal; that refusal is surfaced and the row is NOT deleted.
// A restore brings the lead back in its reversed (unpaid) state, consistent with the
// balances. gorm.DeletedAt on the model makes Delete() a soft delete automatically.
func (h *InvoiceHandler) Delete(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, response.ErrorResponse("invalid invoice id"))
	}

	var invoice model.Invoice
	if err := h.db.First(&invoice, "id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return c.JSON(http.StatusNotFound, response.ErrorResponse("invoice not found"))
		}
		return c.JSON(http.StatusInternalServerError, response.ErrorResponse("failed to fetch invoice"))
	}

	// Reverse the ledgers on a paid lead before trashing it. Use the first configured
	// unpaid status as the resulting label so a later restore reads as a real unpaid lead.
	if invoice.IsPaid {
		newStatus := "Menunggu Pembayaran"
		if ps, err := h.statusRepo.FindFirstUnpaid(); err == nil && ps != nil {
			newStatus = ps.Code
		}
		if err := h.paymentService.ReversePayment(&invoice, newStatus); err != nil {
			return c.JSON(http.StatusUnprocessableEntity, response.ErrorResponse(err.Error()))
		}
	}

	if err := h.db.Delete(&model.Invoice{}, "id = ?", id).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, response.ErrorResponse("failed to delete invoice"))
	}

	return c.JSON(http.StatusOK, response.SuccessResponse(nil, "lead dipindahkan ke trash"))
}
