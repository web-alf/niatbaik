package handler

import (
	"net/http"
	"path"
	"strings"
	"time"

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
	// CreatedAt lets admin backdate an update (RFC3339 or YYYY-MM-DD). Empty = now.
	CreatedAt string `json:"created_at"`
}

// parseUpdateDate accepts RFC3339 (datetime-local + tz) or a bare date; zero on empty/invalid.
func parseUpdateDate(s string) time.Time {
	s = strings.TrimSpace(s)
	if s == "" {
		return time.Time{}
	}
	for _, layout := range []string{time.RFC3339, "2006-01-02T15:04", "2006-01-02"} {
		if t, err := time.ParseInLocation(layout, s, time.Local); err == nil {
			return t
		}
	}
	return time.Time{}
}

// bindUpdateInput binds + validates the shared create/edit payload. Returns the
// normalised input, the bare image filename, and a user-facing error message ("" = ok).
func bindUpdateInput(c echo.Context) (campaignUpdateInput, string, string) {
	var req campaignUpdateInput
	if err := c.Bind(&req); err != nil {
		return req, "", "invalid request body"
	}
	req.Title = strings.TrimSpace(req.Title)
	req.Body = strings.TrimSpace(req.Body)
	if req.Title == "" {
		return req, "", "judul update wajib diisi"
	}
	if len(req.Title) > 255 {
		return req, "", "judul maksimal 255 karakter"
	}
	if req.Body == "" {
		return req, "", "isi update wajib diisi"
	}
	if len(req.Body) > 200_000 {
		return req, "", "isi update terlalu panjang"
	}
	if req.CreatedAt != "" && parseUpdateDate(req.CreatedAt).IsZero() {
		return req, "", "format tanggal tidak valid"
	}

	// Image is a bare upload filename served from /uploads/<name>; strip any path/URL.
	img := strings.TrimSpace(req.Image)
	if img != "" && !strings.Contains(img, "://") {
		img = path.Base(path.Clean("/" + img))
	} else {
		img = ""
	}
	return req, img, ""
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

	req, img, msg := bindUpdateInput(c)
	if msg != "" {
		return c.JSON(http.StatusUnprocessableEntity, response.ErrorResponse(msg))
	}

	u := model.CampaignUpdate{
		CampaignID: campaignID,
		UserID:     claims.UserID,
		Title:      req.Title,
		Body:       req.Body,
		Image:      img,
	}
	if t := parseUpdateDate(req.CreatedAt); !t.IsZero() {
		u.CreatedAt = t // gorm keeps a non-zero CreatedAt on insert
	}
	if err := h.repo.Create(&u); err != nil {
		return c.JSON(http.StatusBadRequest, response.ErrorResponse(err.Error()))
	}
	return c.JSON(http.StatusCreated, response.SuccessResponse(u, "update created"))
}

// Update edits an existing info-update (title/body/image/date). Scoped to the campaign
// in the URL so an update id cannot be edited via another campaign.
func (h *CampaignUpdateHandler) Update(c echo.Context) error {
	campaignID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, response.ErrorResponse("invalid campaign id"))
	}
	id, err := uuid.Parse(c.Param("updateId"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, response.ErrorResponse("invalid update id"))
	}
	u, err := h.repo.FindByCampaign(campaignID, id)
	if err != nil {
		return c.JSON(http.StatusNotFound, response.ErrorResponse("update tidak ditemukan"))
	}

	req, img, msg := bindUpdateInput(c)
	if msg != "" {
		return c.JSON(http.StatusUnprocessableEntity, response.ErrorResponse(msg))
	}

	u.Title = req.Title
	u.Body = req.Body
	u.Image = img
	if t := parseUpdateDate(req.CreatedAt); !t.IsZero() {
		u.CreatedAt = t
	}
	if err := h.repo.Update(u); err != nil {
		return c.JSON(http.StatusBadRequest, response.ErrorResponse(err.Error()))
	}
	return c.JSON(http.StatusOK, response.SuccessResponse(u, "update saved"))
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
