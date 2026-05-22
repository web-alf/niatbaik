package handler

import (
	"net/http"

	"github.com/anrdart/niatbaik-api/internal/dto/response"
	"github.com/anrdart/niatbaik-api/internal/repository"
	"github.com/anrdart/niatbaik-api/pkg/pagination"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

type FundraiserHandler struct {
	fundraiserRepo *repository.FundraiserRepo
	commissionRepo *repository.CommissionRepo
}

func NewFundraiserHandler(fundraiserRepo *repository.FundraiserRepo, commissionRepo *repository.CommissionRepo) *FundraiserHandler {
	return &FundraiserHandler{
		fundraiserRepo: fundraiserRepo,
		commissionRepo: commissionRepo,
	}
}

func (h *FundraiserHandler) List(c echo.Context) error {
	params := pagination.GetPaginationParams(c)

	fundraisers, total, err := h.fundraiserRepo.FindAll(params)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, response.ErrorResponse("failed to fetch fundraisers"))
	}

	p := pagination.Paginate(params, total)
	return c.JSON(http.StatusOK, response.PaginatedResponse(fundraisers, p))
}

func (h *FundraiserHandler) GetDetail(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, response.ErrorResponse("invalid fundraiser id"))
	}

	fundraiser, err := h.fundraiserRepo.FindByID(id)
	if err != nil {
		return c.JSON(http.StatusNotFound, response.ErrorResponse("fundraiser not found"))
	}

	commissions, err := h.commissionRepo.FindByUser(fundraiser.UserID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, response.ErrorResponse("failed to fetch commissions"))
	}

	totalCommission, err := h.commissionRepo.SumByUser(fundraiser.UserID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, response.ErrorResponse("failed to sum commissions"))
	}

	data := map[string]interface{}{
		"fundraiser":       fundraiser,
		"commissions":      commissions,
		"total_commission": totalCommission,
	}

	return c.JSON(http.StatusOK, response.SuccessResponse(data, "success"))
}
