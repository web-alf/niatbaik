package handler

import (
	"net/http"

	"github.com/anrdart/niatbaik-api/internal/dto/response"
	"github.com/anrdart/niatbaik-api/internal/service"
	"github.com/labstack/echo/v4"
)

type DataStudioHandler struct {
	service *service.DataStudioService
}

func NewDataStudioHandler(svc *service.DataStudioService) *DataStudioHandler {
	return &DataStudioHandler{service: svc}
}

func (h *DataStudioHandler) GetOverview(c echo.Context) error {
	data, err := h.service.GetOverview()
	if err != nil {
		return c.JSON(http.StatusInternalServerError, response.ErrorResponse("failed to fetch overview"))
	}
	return c.JSON(http.StatusOK, response.SuccessResponse(data, "success"))
}

func (h *DataStudioHandler) GetFunnel(c echo.Context) error {
	data, err := h.service.GetFunnel()
	if err != nil {
		return c.JSON(http.StatusInternalServerError, response.ErrorResponse("failed to fetch funnel"))
	}
	return c.JSON(http.StatusOK, response.SuccessResponse(data, "success"))
}

func (h *DataStudioHandler) GetMeta(c echo.Context) error    { return h.platform(c, "facebook") }
func (h *DataStudioHandler) GetGoogle(c echo.Context) error  { return h.platform(c, "google") }
func (h *DataStudioHandler) GetTiktok(c echo.Context) error  { return h.platform(c, "tiktok") }

func (h *DataStudioHandler) platform(c echo.Context, name string) error {
	data, err := h.service.GetPlatform(name)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, response.ErrorResponse("failed to fetch platform metrics"))
	}
	return c.JSON(http.StatusOK, response.SuccessResponse(data, "success"))
}

func (h *DataStudioHandler) GetGeo(c echo.Context) error {
	data, err := h.service.GetGeo()
	if err != nil {
		return c.JSON(http.StatusInternalServerError, response.ErrorResponse("failed to fetch geo"))
	}
	return c.JSON(http.StatusOK, response.SuccessResponse(data, "success"))
}
