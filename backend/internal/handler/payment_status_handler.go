package handler

import (
	"fmt"
	"net/http"
	"strings"

	"github.com/anrdart/niatbaik-api/internal/dto/response"
	"github.com/anrdart/niatbaik-api/internal/model"
	"github.com/anrdart/niatbaik-api/internal/repository"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

type PaymentStatusHandler struct {
	repo *repository.PaymentStatusRepo
}

func NewPaymentStatusHandler(repo *repository.PaymentStatusRepo) *PaymentStatusHandler {
	return &PaymentStatusHandler{repo: repo}
}

type paymentStatusInput struct {
	Code      string `json:"code"`
	Label     string `json:"label"`
	Color     string `json:"color"`
	IsPaid    bool   `json:"is_paid"`
	IsDefault bool   `json:"is_default"`
	SortOrder int    `json:"sort_order"`
}

func (h *PaymentStatusHandler) List(c echo.Context) error {
	data, err := h.repo.FindAll()
	if err != nil {
		return c.JSON(http.StatusInternalServerError, response.ErrorResponse("failed to fetch payment statuses"))
	}
	return c.JSON(http.StatusOK, response.SuccessResponse(data, "success"))
}

func (h *PaymentStatusHandler) Create(c echo.Context) error {
	var req paymentStatusInput
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, response.ErrorResponse("invalid request body"))
	}
	req.Code = strings.TrimSpace(req.Code)
	req.Label = strings.TrimSpace(req.Label)
	if req.Code == "" || req.Label == "" {
		return c.JSON(http.StatusUnprocessableEntity, response.ErrorResponse("code dan label wajib diisi"))
	}
	if len(req.Code) > 50 || len(req.Label) > 100 {
		return c.JSON(http.StatusUnprocessableEntity, response.ErrorResponse("code maks 50 / label maks 100 karakter"))
	}
	if h.repo.CodeExists(req.Code, nil) {
		return c.JSON(http.StatusConflict, response.ErrorResponse("status dengan code ini sudah ada"))
	}
	s := model.PaymentStatus{
		Code: req.Code, Label: req.Label, Color: req.Color,
		IsPaid: req.IsPaid, IsDefault: req.IsDefault, SortOrder: req.SortOrder,
	}
	if err := h.repo.Create(&s); err != nil {
		return c.JSON(http.StatusBadRequest, response.ErrorResponse(err.Error()))
	}
	return c.JSON(http.StatusCreated, response.SuccessResponse(s, "payment status created"))
}

func (h *PaymentStatusHandler) Update(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, response.ErrorResponse("invalid id"))
	}
	s, err := h.repo.FindByID(id)
	if err != nil {
		return c.JSON(http.StatusNotFound, response.ErrorResponse("payment status not found"))
	}
	var req paymentStatusInput
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, response.ErrorResponse("invalid request body"))
	}
	req.Code = strings.TrimSpace(req.Code)
	req.Label = strings.TrimSpace(req.Label)
	if req.Code != "" && req.Code != s.Code {
		if len(req.Code) > 50 {
			return c.JSON(http.StatusUnprocessableEntity, response.ErrorResponse("code maks 50 karakter"))
		}
		if h.repo.CodeExists(req.Code, &s.ID) {
			return c.JSON(http.StatusConflict, response.ErrorResponse("status dengan code ini sudah ada"))
		}
		s.Code = req.Code
	}
	if req.Label != "" {
		s.Label = req.Label
	}
	s.Color = req.Color
	s.IsPaid = req.IsPaid
	s.IsDefault = req.IsDefault
	s.SortOrder = req.SortOrder
	if err := h.repo.Update(s); err != nil {
		return c.JSON(http.StatusBadRequest, response.ErrorResponse(err.Error()))
	}
	return c.JSON(http.StatusOK, response.SuccessResponse(s, "payment status updated"))
}

func (h *PaymentStatusHandler) Delete(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, response.ErrorResponse("invalid id"))
	}
	s, err := h.repo.FindByID(id)
	if err != nil {
		return c.JSON(http.StatusNotFound, response.ErrorResponse("payment status not found"))
	}
	// Guard: never delete the default status (new invoices fall back to it) or one
	// still referenced by invoices (would orphan their status label).
	if s.IsDefault {
		return c.JSON(http.StatusConflict, response.ErrorResponse("status default tidak dapat dihapus; tetapkan status default lain dulu"))
	}
	if n, _ := h.repo.CountInvoicesUsing(s.Code); n > 0 {
		return c.JSON(http.StatusConflict, response.ErrorResponse(fmt.Sprintf("status dipakai oleh %d invoice, tidak dapat dihapus", n)))
	}
	if err := h.repo.Delete(id); err != nil {
		return c.JSON(http.StatusBadRequest, response.ErrorResponse(err.Error()))
	}
	return c.JSON(http.StatusOK, response.SuccessResponse(nil, "payment status deleted"))
}
