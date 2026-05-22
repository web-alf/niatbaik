package handler

import (
	"net/http"

	"github.com/anrdart/niatbaik-api/internal/dto/response"
	"github.com/anrdart/niatbaik-api/internal/repository"
	"github.com/anrdart/niatbaik-api/internal/service"
	"github.com/anrdart/niatbaik-api/pkg/pagination"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

type WithdrawalHandler struct {
	service        *service.WithdrawalService
	withdrawalRepo *repository.WithdrawalRepo
}

func NewWithdrawalHandler(svc *service.WithdrawalService, repo *repository.WithdrawalRepo) *WithdrawalHandler {
	return &WithdrawalHandler{service: svc, withdrawalRepo: repo}
}

func (h *WithdrawalHandler) List(c echo.Context) error {
	params := pagination.GetPaginationParams(c)
	status := c.QueryParam("status")

	items, total, err := h.withdrawalRepo.FindAll(params, status)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, response.ErrorResponse("failed to fetch withdrawals"))
	}

	p := pagination.Paginate(params, total)
	return c.JSON(http.StatusOK, response.PaginatedResponse(items, p))
}

func (h *WithdrawalHandler) Approve(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, response.ErrorResponse("invalid withdrawal id"))
	}

	if err := h.service.Approve(id); err != nil {
		return c.JSON(http.StatusBadRequest, response.ErrorResponse(err.Error()))
	}

	return c.JSON(http.StatusOK, response.SuccessResponse(nil, "withdrawal approved"))
}

func (h *WithdrawalHandler) Reject(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, response.ErrorResponse("invalid withdrawal id"))
	}

	if err := h.service.Reject(id); err != nil {
		return c.JSON(http.StatusBadRequest, response.ErrorResponse(err.Error()))
	}

	return c.JSON(http.StatusOK, response.SuccessResponse(nil, "withdrawal rejected"))
}
