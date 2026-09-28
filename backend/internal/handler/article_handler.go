package handler

import (
	"net/http"
	"strings"
	"time"

	"github.com/anrdart/niatbaik-api/internal/dto/response"
	"github.com/anrdart/niatbaik-api/internal/middleware"
	"github.com/anrdart/niatbaik-api/internal/model"
	"github.com/anrdart/niatbaik-api/internal/repository"
	"github.com/anrdart/niatbaik-api/pkg/pagination"
	"github.com/anrdart/niatbaik-api/pkg/slug"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

// ArticleHandler serves the "Berita" editorial content: the admin list/editor plus the
// public news list/detail. Replaces the frontend's dummy article rows.
type ArticleHandler struct {
	repo *repository.ArticleRepo
}

func NewArticleHandler(repo *repository.ArticleRepo) *ArticleHandler {
	return &ArticleHandler{repo: repo}
}

// Excerpt/Image are pointers so an omitted key ("no change") is distinguishable from
// an explicit "" ("clear this field") — the editor's "Hapus cover" sends the latter.
type articleInput struct {
	Title      string  `json:"title"`
	Excerpt    *string `json:"excerpt"`
	Content    string  `json:"content"`
	Image      *string `json:"image"`
	Status     string  `json:"status"`
	CategoryID string  `json:"category_id"`
}

// validate trims the payload and enforces the shared rules. requireBody is false on
// update so a partial edit (e.g. status-only toggle) doesn't have to resend content.
func (in *articleInput) validate(requireBody bool) (string, bool) {
	in.Title = strings.TrimSpace(in.Title)
	in.Content = strings.TrimSpace(in.Content)
	in.Status = strings.TrimSpace(in.Status)
	if in.Excerpt != nil {
		trimmed := strings.TrimSpace(*in.Excerpt)
		in.Excerpt = &trimmed
	}

	if requireBody && in.Title == "" {
		return "judul berita wajib diisi", false
	}
	if len(in.Title) > 255 {
		return "judul maksimal 255 karakter", false
	}
	if in.Excerpt != nil && len(*in.Excerpt) > 500 {
		return "ringkasan maksimal 500 karakter", false
	}
	if requireBody && in.Content == "" {
		return "isi berita wajib diisi", false
	}
	if in.Status != "" && in.Status != "Draft" && in.Status != "Published" {
		return "status harus Draft atau Published", false
	}
	return "", true
}

func deref(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}

// parseCategory maps the optional category_id string to a UUID pointer. An empty
// string clears the category; a malformed one is rejected rather than silently dropped.
func parseCategory(raw string) (*uuid.UUID, bool) {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return nil, true
	}
	id, err := uuid.Parse(raw)
	if err != nil {
		return nil, false
	}
	return &id, true
}

// List is the admin table: all statuses, optional ?status= and ?search= filters.
func (h *ArticleHandler) List(c echo.Context) error {
	params := pagination.GetPaginationParams(c)
	articles, total, err := h.repo.FindAll(params, c.QueryParam("status"), c.QueryParam("search"))
	if err != nil {
		return c.JSON(http.StatusInternalServerError, response.ErrorResponse("failed to fetch articles"))
	}
	return c.JSON(http.StatusOK, response.PaginatedResponse(articles, pagination.Paginate(params, total)))
}

func (h *ArticleHandler) Get(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, response.ErrorResponse("invalid article id"))
	}
	a, err := h.repo.FindByID(id)
	if err != nil {
		return c.JSON(http.StatusNotFound, response.ErrorResponse("article not found"))
	}
	return c.JSON(http.StatusOK, response.SuccessResponse(a, "success"))
}

func (h *ArticleHandler) Create(c echo.Context) error {
	claims := middleware.GetUserFromContext(c)
	if claims == nil {
		return c.JSON(http.StatusUnauthorized, response.ErrorResponse("unauthorized"))
	}

	var req articleInput
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, response.ErrorResponse("invalid request body"))
	}
	if msg, ok := req.validate(true); !ok {
		return c.JSON(http.StatusUnprocessableEntity, response.ErrorResponse(msg))
	}
	categoryID, ok := parseCategory(req.CategoryID)
	if !ok {
		return c.JSON(http.StatusUnprocessableEntity, response.ErrorResponse("kategori tidak valid"))
	}

	status := req.Status
	if status == "" {
		status = "Draft"
	}

	a := model.Article{
		UserID:     claims.UserID,
		CategoryID: categoryID,
		Title:      req.Title,
		Slug: slug.GenerateUnique(req.Title, func(candidate string) bool {
			return h.repo.SlugExists(candidate, nil)
		}),
		Excerpt: deref(req.Excerpt),
		Content: req.Content,
		Image:   deref(req.Image),
		Status:  status,
	}
	if status == "Published" {
		now := time.Now()
		a.PublishedAt = &now
	}

	if err := h.repo.Create(&a); err != nil {
		return c.JSON(http.StatusBadRequest, response.ErrorResponse(err.Error()))
	}
	return c.JSON(http.StatusCreated, response.SuccessResponse(a, "article created"))
}

func (h *ArticleHandler) Update(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, response.ErrorResponse("invalid article id"))
	}
	a, err := h.repo.FindByID(id)
	if err != nil {
		return c.JSON(http.StatusNotFound, response.ErrorResponse("article not found"))
	}

	var req articleInput
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, response.ErrorResponse("invalid request body"))
	}
	if msg, ok := req.validate(false); !ok {
		return c.JSON(http.StatusUnprocessableEntity, response.ErrorResponse(msg))
	}

	if req.Title != "" && req.Title != a.Title {
		a.Title = req.Title
		articleID := a.ID
		a.Slug = slug.GenerateUnique(req.Title, func(candidate string) bool {
			return h.repo.SlugExists(candidate, &articleID)
		})
	}
	// nil = key absent = leave as-is; "" = explicit clear (e.g. "Hapus cover").
	if req.Excerpt != nil {
		a.Excerpt = *req.Excerpt
	}
	if req.Image != nil {
		a.Image = *req.Image
	}
	if req.Content != "" {
		a.Content = req.Content
	}
	if strings.TrimSpace(req.CategoryID) != "" {
		categoryID, ok := parseCategory(req.CategoryID)
		if !ok {
			return c.JSON(http.StatusUnprocessableEntity, response.ErrorResponse("kategori tidak valid"))
		}
		a.CategoryID = categoryID
	}
	if req.Status != "" && req.Status != a.Status {
		a.Status = req.Status
		// Stamp the publish date once, on the first Draft → Published transition.
		if req.Status == "Published" && a.PublishedAt == nil {
			now := time.Now()
			a.PublishedAt = &now
		}
	}

	if err := h.repo.Update(a); err != nil {
		return c.JSON(http.StatusBadRequest, response.ErrorResponse(err.Error()))
	}
	return c.JSON(http.StatusOK, response.SuccessResponse(a, "article updated"))
}

func (h *ArticleHandler) Delete(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, response.ErrorResponse("invalid article id"))
	}
	if _, err := h.repo.FindByID(id); err != nil {
		return c.JSON(http.StatusNotFound, response.ErrorResponse("article not found"))
	}
	if err := h.repo.Delete(id); err != nil {
		return c.JSON(http.StatusBadRequest, response.ErrorResponse(err.Error()))
	}
	return c.JSON(http.StatusOK, response.SuccessResponse(nil, "article deleted"))
}

// ListPublic is the public news list — Published rows only.
func (h *ArticleHandler) ListPublic(c echo.Context) error {
	params := pagination.GetPaginationParams(c)
	articles, total, err := h.repo.FindPublished(params, c.QueryParam("category"), c.QueryParam("search"))
	if err != nil {
		return c.JSON(http.StatusInternalServerError, response.ErrorResponse("failed to fetch articles"))
	}
	return c.JSON(http.StatusOK, response.PaginatedResponse(articles, pagination.Paginate(params, total)))
}

// GetPublic is the public detail page, by slug. Drafts 404 here.
func (h *ArticleHandler) GetPublic(c echo.Context) error {
	a, err := h.repo.FindPublishedBySlug(c.Param("slug"))
	if err != nil {
		return c.JSON(http.StatusNotFound, response.ErrorResponse("article not found"))
	}
	return c.JSON(http.StatusOK, response.SuccessResponse(a, "success"))
}
