package handler

import (
	"net/http"

	"github.com/anrdart/niatbaik-api/internal/dto/response"
	"github.com/anrdart/niatbaik-api/internal/service"
	"github.com/labstack/echo/v4"
)

type SiteContentHandler struct {
	service *service.SiteContentService
}

func NewSiteContentHandler(svc *service.SiteContentService) *SiteContentHandler {
	return &SiteContentHandler{service: svc}
}

// GetAll (admin) returns every section's raw JSON keyed by section.
func (h *SiteContentHandler) GetAll(c echo.Context) error {
	rows, err := h.service.PublicMap()
	if err != nil {
		return c.JSON(http.StatusInternalServerError, response.ErrorResponse("failed to fetch site content"))
	}
	return c.JSON(http.StatusOK, response.SuccessResponse(rows, "success"))
}

// Update (admin) upserts one section. :key must be in the allowlist.
func (h *SiteContentHandler) Update(c echo.Context) error {
	key := c.Param("key")
	var body any
	if err := c.Bind(&body); err != nil {
		return c.JSON(http.StatusBadRequest, response.ErrorResponse("invalid body"))
	}
	if err := h.service.UpdateSection(key, body); err != nil {
		return c.JSON(http.StatusUnprocessableEntity, response.ErrorResponse(err.Error()))
	}
	return c.JSON(http.StatusOK, response.SuccessResponse(nil, "section updated"))
}

// GetPublic returns the key→JSON map for public consumption (no auth). Missing sections
// are simply omitted; the SPA falls back to its built-in defaults.
func (h *SiteContentHandler) GetPublic(c echo.Context) error {
	rows, err := h.service.PublicMap()
	if err != nil {
		return c.JSON(http.StatusInternalServerError, response.ErrorResponse("failed to fetch site content"))
	}
	return c.JSON(http.StatusOK, response.SuccessResponse(rows, "success"))
}
