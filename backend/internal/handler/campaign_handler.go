package handler

import (
	"net/http"

	"github.com/anrdart/niatbaik-api/internal/dto/request"
	"github.com/anrdart/niatbaik-api/internal/dto/response"
	"github.com/anrdart/niatbaik-api/internal/middleware"
	"github.com/anrdart/niatbaik-api/internal/repository"
	"github.com/anrdart/niatbaik-api/internal/service"
	"github.com/anrdart/niatbaik-api/pkg/pagination"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

type AdminCampaignHandler struct {
	service      *service.CampaignService
	campaignRepo *repository.CampaignRepo
}

func NewAdminCampaignHandler(svc *service.CampaignService, repo *repository.CampaignRepo) *AdminCampaignHandler {
	return &AdminCampaignHandler{service: svc, campaignRepo: repo}
}

func (h *AdminCampaignHandler) List(c echo.Context) error {
	params := pagination.GetPaginationParams(c)
	status := c.QueryParam("status")
	search := c.QueryParam("search")

	campaigns, total, err := h.campaignRepo.FindAllLegacy(params, status, search)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, response.ErrorResponse("failed to fetch campaigns"))
	}

	p := pagination.Paginate(params, total)
	return c.JSON(http.StatusOK, response.PaginatedResponse(campaigns, p))
}

func (h *AdminCampaignHandler) Create(c echo.Context) error {
	claims := middleware.GetUserFromContext(c)
	if claims == nil {
		return c.JSON(http.StatusUnauthorized, response.ErrorResponse("unauthorized"))
	}

	var req request.CreateCampaignRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, response.ErrorResponse("invalid request body"))
	}
	if err := c.Validate(&req); err != nil {
		return c.JSON(http.StatusUnprocessableEntity, response.ErrorResponse(err.Error()))
	}

	campaign, err := h.service.Create(&req, claims.UserID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, response.ErrorResponse(err.Error()))
	}

	return c.JSON(http.StatusCreated, response.SuccessResponse(campaign, "campaign created"))
}

func (h *AdminCampaignHandler) Update(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, response.ErrorResponse("invalid campaign id"))
	}

	var req request.UpdateCampaignRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, response.ErrorResponse("invalid request body"))
	}
	if err := c.Validate(&req); err != nil {
		return c.JSON(http.StatusUnprocessableEntity, response.ErrorResponse(err.Error()))
	}

	campaign, err := h.service.Update(id, &req)
	if err != nil {
		return c.JSON(http.StatusNotFound, response.ErrorResponse(err.Error()))
	}

	return c.JSON(http.StatusOK, response.SuccessResponse(campaign, "campaign updated"))
}

func (h *AdminCampaignHandler) Delete(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, response.ErrorResponse("invalid campaign id"))
	}

	if err := h.service.Delete(id); err != nil {
		return c.JSON(http.StatusNotFound, response.ErrorResponse(err.Error()))
	}

	return c.JSON(http.StatusOK, response.SuccessResponse(nil, "campaign deleted"))
}

// Get returns the FULL campaign record for the admin editor. The public list and
// detail responses are intentionally trimmed (no advanced toggles / raw fields),
// which made the editor lose the rich-text story image and revert Publish/advanced
// settings on re-edit. The editor needs every persisted field to round-trip, so
// this returns the raw model.
func (h *AdminCampaignHandler) Get(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, response.ErrorResponse("invalid campaign id"))
	}

	campaign, err := h.campaignRepo.FindByID(id)
	if err != nil {
		return c.JSON(http.StatusNotFound, response.ErrorResponse("campaign not found"))
	}

	return c.JSON(http.StatusOK, response.SuccessResponse(campaign, "success"))
}
