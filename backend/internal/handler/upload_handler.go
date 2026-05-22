package handler

import (
	"net/http"

	"github.com/anrdart/niatbaik-api/internal/dto/response"
	"github.com/anrdart/niatbaik-api/internal/middleware"
	"github.com/anrdart/niatbaik-api/internal/service"
	"github.com/labstack/echo/v4"
)

type UploadHandler struct {
	uploadService *service.UploadService
}

func NewUploadHandler(uploadService *service.UploadService) *UploadHandler {
	return &UploadHandler{uploadService: uploadService}
}

func (h *UploadHandler) UploadImage(c echo.Context) error {
	claims := middleware.GetUserFromContext(c)
	if claims == nil {
		return c.JSON(http.StatusUnauthorized, response.ErrorResponse("unauthorized"))
	}

	fileHeader, err := c.FormFile("image")
	if err != nil {
		return c.JSON(http.StatusBadRequest, response.ErrorResponse("image file required"))
	}

	file, err := fileHeader.Open()
	if err != nil {
		return c.JSON(http.StatusInternalServerError, response.ErrorResponse("failed to open file"))
	}
	defer file.Close()

	filename, err := h.uploadService.UploadImage(file, fileHeader)
	if err != nil {
		return c.JSON(http.StatusBadRequest, response.ErrorResponse(err.Error()))
	}

	data := map[string]string{
		"filename": filename,
		"url":      "/uploads/" + filename,
	}

	return c.JSON(http.StatusOK, response.SuccessResponse(data, "image uploaded"))
}
