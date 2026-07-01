package handler

import (
	"errors"
	"net/http"
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
}

func NewInvoiceHandler(db *gorm.DB, paymentService *service.PaymentService, statusRepo *repository.PaymentStatusRepo) *InvoiceHandler {
	return &InvoiceHandler{db: db, paymentService: paymentService, statusRepo: statusRepo}
}

func (h *InvoiceHandler) List(c echo.Context) error {
	params := pagination.GetPaginationParams(c)

	query := h.db.Model(&model.Invoice{})

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

	var total int64
	if err := query.Count(&total).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, response.ErrorResponse("failed to count invoices"))
	}

	var invoices []model.Invoice
	err := pagination.ApplyPagination(query, params).
		Preload("Campaign").
		Preload("PaymentMethod").
		Find(&invoices).Error
	if err != nil {
		return c.JSON(http.StatusInternalServerError, response.ErrorResponse("failed to fetch invoices"))
	}

	p := pagination.Paginate(params, total)
	return c.JSON(http.StatusOK, response.PaginatedResponse(response.ToInvoiceListResponse(invoices), p))
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

	// Target status is NOT paid. If the invoice was previously settled, also clear
	// is_paid/paid_at so the row stays internally consistent (otherwise is_paid=true
	// with an unpaid status label corrupts every consumer that keys on is_paid, and the
	// leads payment-toggle would snap back to "paid"). NOTE: this intentionally does NOT
	// reverse the campaign/global balance or fundraiser commission — the admin UI warns
	// about this. A true refund must reverse that bookkeeping in a locked transaction.
	updates := map[string]any{"status": req.Status}
	if invoice.IsPaid {
		updates["is_paid"] = false
		updates["paid_at"] = nil
	}
	if err := h.db.Model(&invoice).Updates(updates).Error; err != nil {
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
