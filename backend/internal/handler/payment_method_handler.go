package handler

import (
	"net/http"
	"strings"

	"github.com/anrdart/niatbaik-api/internal/dto/request"
	"github.com/anrdart/niatbaik-api/internal/dto/response"
	"github.com/anrdart/niatbaik-api/internal/service"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

type PaymentMethodHandler struct {
	service *service.PaymentMethodService
}

func NewPaymentMethodHandler(svc *service.PaymentMethodService) *PaymentMethodHandler {
	return &PaymentMethodHandler{service: svc}
}

func (h *PaymentMethodHandler) List(c echo.Context) error {
	data, err := h.service.List()
	if err != nil {
		return c.JSON(http.StatusInternalServerError, response.ErrorResponse("failed to fetch payment methods"))
	}
	return c.JSON(http.StatusOK, response.SuccessResponse(data, "success"))
}

func (h *PaymentMethodHandler) Create(c echo.Context) error {
	var req request.PaymentMethodInput
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, response.ErrorResponse("invalid request body"))
	}
	// Normalize type casing ('QRIS'/'Card' from the admin form) before enum validation.
	req.Type = strings.ToLower(strings.TrimSpace(req.Type))
	if err := c.Validate(&req); err != nil {
		return c.JSON(http.StatusUnprocessableEntity, response.ErrorResponse(err.Error()))
	}
	pm, err := h.service.Create(&req)
	if err != nil {
		return c.JSON(http.StatusBadRequest, response.ErrorResponse(err.Error()))
	}
	return c.JSON(http.StatusCreated, response.SuccessResponse(pm, "payment method created"))
}

func (h *PaymentMethodHandler) Update(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, response.ErrorResponse("invalid payment method id"))
	}
	var req request.PaymentMethodInput
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, response.ErrorResponse("invalid request body"))
	}
	req.Type = strings.ToLower(strings.TrimSpace(req.Type))
	if err := c.Validate(&req); err != nil {
		return c.JSON(http.StatusUnprocessableEntity, response.ErrorResponse(err.Error()))
	}
	pm, err := h.service.Update(id, &req)
	if err != nil {
		return c.JSON(http.StatusNotFound, response.ErrorResponse(err.Error()))
	}
	return c.JSON(http.StatusOK, response.SuccessResponse(pm, "payment method updated"))
}

func (h *PaymentMethodHandler) Delete(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, response.ErrorResponse("invalid payment method id"))
	}
	if err := h.service.Delete(id); err != nil {
		return c.JSON(http.StatusBadRequest, response.ErrorResponse(err.Error()))
	}
	return c.JSON(http.StatusOK, response.SuccessResponse(nil, "payment method deleted"))
}
