package handler

import (
	"net/http"
	"strings"

	"github.com/anrdart/niatbaik-api/internal/dto/response"
	"github.com/anrdart/niatbaik-api/internal/middleware"
	"github.com/anrdart/niatbaik-api/internal/model"
	"github.com/anrdart/niatbaik-api/internal/repository"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

// CampaignUpdateHandler manages the per-campaign "info update" timeline shown on the
// campaign detail page. Backs the "Add Info Update" admin action (was a toast stub).
type CampaignUpdateHandler struct {
	repo *repository.CampaignUpdateRepo
}

func NewCampaignUpdateHandler(repo *repository.CampaignUpdateRepo) *CampaignUpdateHandler {
	return &CampaignUpdateHandler{repo: repo}
}

type campaignUpdateInput struct {
	Title string `json:"title"`
	Body  string `json:"body"`
	Image string `json:"image"`
}

func (h *CampaignUpdateHandler) List(c echo.Context) error {
	campaignID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, response.ErrorResponse("invalid campaign id"))
	}
	updates, err := h.repo.ListByCampaign(campaignID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, response.ErrorResponse("failed to fetch updates"))
	}
	return c.JSON(http.StatusOK, response.SuccessResponse(updates, "success"))
}

func (h *CampaignUpdateHandler) Create(c echo.Context) error {
	claims := middleware.GetUserFromContext(c)
	if claims == nil {
		return c.JSON(http.StatusUnauthorized, response.ErrorResponse("unauthorized"))
	}
	campaignID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, response.ErrorResponse("invalid campaign id"))
	}

	var req campaignUpdateInput
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, response.ErrorResponse("invalid request body"))
	}
	req.Title = strings.TrimSpace(req.Title)
	req.Body = strings.TrimSpace(req.Body)
	if req.Title == "" {
		return c.JSON(http.StatusUnprocessableEntity, response.ErrorResponse("judul update wajib diisi"))
	}
	if len(req.Title) > 255 {
		return c.JSON(http.StatusUnprocessableEntity, response.ErrorResponse("judul maksimal 255 karakter"))
	}
	if req.Body == "" {
		return c.JSON(http.StatusUnprocessableEntity, response.ErrorResponse("isi update wajib diisi"))
	}

	u := model.CampaignUpdate{
		CampaignID: campaignID,
		UserID:     claims.UserID,
		Title:      req.Title,
		Body:       req.Body,
		Image:      req.Image,
	}
	if err := h.repo.Create(&u); err != nil {
		return c.JSON(http.StatusBadRequest, response.ErrorResponse(err.Error()))
	}
	return c.JSON(http.StatusCreated, response.SuccessResponse(u, "update created"))
}

func (h *CampaignUpdateHandler) Delete(c echo.Context) error {
	id, err := uuid.Parse(c.Param("updateId"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, response.ErrorResponse("invalid update id"))
	}
	if err := h.repo.Delete(id); err != nil {
		return c.JSON(http.StatusBadRequest, response.ErrorResponse(err.Error()))
	}
	return c.JSON(http.StatusOK, response.SuccessResponse(nil, "update deleted"))
}
