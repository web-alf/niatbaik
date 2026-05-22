package handler

import (
	"net/http"

	"github.com/anrdart/niatbaik-api/internal/dto/response"
	"github.com/anrdart/niatbaik-api/internal/service"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

type TrashHandler struct {
	service *service.TrashService
}

func NewTrashHandler(svc *service.TrashService) *TrashHandler {
	return &TrashHandler{service: svc}
}

func (h *TrashHandler) List(c echo.Context) error {
	data, err := h.service.GetAll()
	if err != nil {
		return c.JSON(http.StatusInternalServerError, response.ErrorResponse("failed to fetch trash"))
	}

	return c.JSON(http.StatusOK, response.SuccessResponse(data, "success"))
}

func (h *TrashHandler) Restore(c echo.Context) error {
	itemType := c.Param("type")
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, response.ErrorResponse("invalid id"))
	}

	if err := h.service.Restore(itemType, id); err != nil {
		return c.JSON(http.StatusBadRequest, response.ErrorResponse(err.Error()))
	}

	return c.JSON(http.StatusOK, response.SuccessResponse(nil, "item restored"))
}

func (h *TrashHandler) PermanentDelete(c echo.Context) error {
	itemType := c.Param("type")
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, response.ErrorResponse("invalid id"))
	}

	if err := h.service.PermanentDelete(itemType, id); err != nil {
		return c.JSON(http.StatusBadRequest, response.ErrorResponse(err.Error()))
	}

	return c.JSON(http.StatusOK, response.SuccessResponse(nil, "item permanently deleted"))
}
