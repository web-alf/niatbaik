package handler

import (
	"net/http"

	"github.com/anrdart/niatbaik-api/internal/dto/response"
	"github.com/anrdart/niatbaik-api/internal/repository"
	"github.com/anrdart/niatbaik-api/internal/service"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

type VerificationHandler struct {
	service          *service.VerificationService
	verificationRepo *repository.VerificationRepo
}

func NewVerificationHandler(svc *service.VerificationService, repo *repository.VerificationRepo) *VerificationHandler {
	return &VerificationHandler{service: svc, verificationRepo: repo}
}

func (h *VerificationHandler) List(c echo.Context) error {
	users, err := h.verificationRepo.FindPending()
	if err != nil {
		return c.JSON(http.StatusInternalServerError, response.ErrorResponse("failed to fetch verifications"))
	}

	return c.JSON(http.StatusOK, response.SuccessResponse(users, "success"))
}

func (h *VerificationHandler) Approve(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, response.ErrorResponse("invalid user id"))
	}

	if err := h.service.Approve(id); err != nil {
		return c.JSON(http.StatusBadRequest, response.ErrorResponse(err.Error()))
	}

	return c.JSON(http.StatusOK, response.SuccessResponse(nil, "verification approved"))
}

func (h *VerificationHandler) Reject(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, response.ErrorResponse("invalid user id"))
	}

	if err := h.service.Reject(id); err != nil {
		return c.JSON(http.StatusBadRequest, response.ErrorResponse(err.Error()))
	}

	return c.JSON(http.StatusOK, response.SuccessResponse(nil, "verification rejected"))
}
