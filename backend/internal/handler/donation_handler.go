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

func (h *DonationHandler) GetPaymentStatus(c echo.Context) error {
	invoiceNumber := c.Param("invoice")
	invoice, err := h.donationService.GetPaymentStatus(invoiceNumber)
	if err != nil {
		return c.JSON(http.StatusNotFound, response.ErrorResponse("Invoice not found"))
	}

	return c.JSON(http.StatusOK, response.SuccessResponse(
		response.ToPaymentStatusResponse(invoice),
		"success",
	))
}
