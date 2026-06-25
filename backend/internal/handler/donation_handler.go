package handler

import (
	"net/http"

	"github.com/anrdart/niatbaik-api/internal/dto/request"
	"github.com/anrdart/niatbaik-api/internal/dto/response"
	"github.com/anrdart/niatbaik-api/internal/service"
	"github.com/labstack/echo/v4"
)

type DonationHandler struct {
	donationService *service.DonationService
}

func NewDonationHandler(donationService *service.DonationService) *DonationHandler {
	return &DonationHandler{donationService: donationService}
}

func (h *DonationHandler) CreateDonation(c echo.Context) error {
	var req request.CreateDonationRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, response.ErrorResponse("Invalid request body"))
	}
	if err := c.Validate(req); err != nil {
		return c.JSON(http.StatusBadRequest, response.ErrorResponse(response.ValidationMessage(err)))
	}

	ip := c.RealIP()
	invoice, err := h.donationService.CreateDonation(&req, ip)
	if err != nil {
		return c.JSON(http.StatusBadRequest, response.ErrorResponse(err.Error()))
	}

	return c.JSON(http.StatusCreated, response.SuccessResponse(
		response.ToInvoiceResponse(invoice),
		"Donation created successfully",
	))
}

// SimulatePayment settles an invoice without a real transfer — a sandbox/test-only
// "continue to paid" action for methods (QRIS / VA / manual) that otherwise have no way
// to advance during testing. The service hard-rejects this in production; the route is
// also only mounted in non-production (see router).
func (h *DonationHandler) SimulatePayment(c echo.Context) error {
	invoiceNumber := c.Param("invoice")
	invoice, err := h.donationService.SimulatePayment(invoiceNumber)
	if err != nil {
		return c.JSON(http.StatusBadRequest, response.ErrorResponse(err.Error()))
	}
	return c.JSON(http.StatusOK, response.SuccessResponse(
		response.ToPaymentStatusResponse(invoice),
		"Pembayaran disimulasikan (sandbox)",
	))
}

func (h *DonationHandler) GetPaymentStatus(c echo.Context) error {
	invoiceNumber := c.Param("invoice")
	invoice, err := h.donationService.GetPaymentStatus(invoiceNumber)
	if err != nil {
		return c.JSON(http.StatusNotFound, response.ErrorResponse("Invoice not found"))
	}

	return c.JSON(http.StatusOK, response.SuccessResponse(
		response.ToInvoiceResponse(invoice),
		"success",
	))
}
