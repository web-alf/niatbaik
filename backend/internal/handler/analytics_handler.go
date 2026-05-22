package handler

import (
	"net/http"

	"github.com/anrdart/niatbaik-api/internal/dto/response"
	"github.com/anrdart/niatbaik-api/internal/service"
	"github.com/labstack/echo/v4"
)

type AnalyticsHandler struct {
	service *service.AnalyticsService
}

func NewAnalyticsHandler(svc *service.AnalyticsService) *AnalyticsHandler {
	return &AnalyticsHandler{service: svc}
}

func (h *AnalyticsHandler) GetOverview(c echo.Context) error {
	data, err := h.service.GetOverview()
	if err != nil {
		return c.JSON(http.StatusInternalServerError, response.ErrorResponse("failed to fetch analytics overview"))
	}

	return c.JSON(http.StatusOK, response.SuccessResponse(data, "success"))
}

func (h *AnalyticsHandler) GetCampaignPerformance(c echo.Context) error {
	data, err := h.service.GetCampaignPerformance()
	if err != nil {
		return c.JSON(http.StatusInternalServerError, response.ErrorResponse("failed to fetch campaign performance"))
	}

	return c.JSON(http.StatusOK, response.SuccessResponse(data, "success"))
}

func (h *AnalyticsHandler) GetUTMTracking(c echo.Context) error {
	data, err := h.service.GetUTMData()
	if err != nil {
		return c.JSON(http.StatusInternalServerError, response.ErrorResponse("failed to fetch UTM data"))
	}

	return c.JSON(http.StatusOK, response.SuccessResponse(data, "success"))
}

func (h *AnalyticsHandler) GetTrafficBreakdown(c echo.Context) error {
	data, err := h.service.GetTrafficBreakdown()
	if err != nil {
		return c.JSON(http.StatusInternalServerError, response.ErrorResponse("failed to fetch traffic breakdown"))
	}

	return c.JSON(http.StatusOK, response.SuccessResponse(data, "success"))
}
