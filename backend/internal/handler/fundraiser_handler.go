package handler

import (
	"net/http"
	"strings"

	"github.com/anrdart/niatbaik-api/internal/dto/request"
	"github.com/anrdart/niatbaik-api/internal/dto/response"
	"github.com/anrdart/niatbaik-api/internal/middleware"
	"github.com/anrdart/niatbaik-api/internal/model"
	"github.com/anrdart/niatbaik-api/internal/repository"
	"github.com/anrdart/niatbaik-api/internal/service"
	"github.com/anrdart/niatbaik-api/pkg/pagination"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

type FundraiserHandler struct {
	fundraiserRepo *repository.FundraiserRepo
	commissionRepo *repository.CommissionRepo
	userRepo       *repository.UserRepo
	userService    *service.UserService
}

func NewFundraiserHandler(fundraiserRepo *repository.FundraiserRepo, commissionRepo *repository.CommissionRepo, userRepo *repository.UserRepo, userService *service.UserService) *FundraiserHandler {
	return &FundraiserHandler{
		fundraiserRepo: fundraiserRepo,
		commissionRepo: commissionRepo,
		userRepo:       userRepo,
		userService:    userService,
	}
}

func (h *FundraiserHandler) List(c echo.Context) error {
	params := pagination.GetPaginationParams(c)

	fundraisers, total, err := h.fundraiserRepo.FindAll(params)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, response.ErrorResponse("failed to fetch fundraisers"))
	}

	p := pagination.Paginate(params, total)
	return c.JSON(http.StatusOK, response.PaginatedResponse(fundraisers, p))
}

func (h *FundraiserHandler) GetDetail(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, response.ErrorResponse("invalid fundraiser id"))
	}

	fundraiser, err := h.fundraiserRepo.FindByID(id)
	if err != nil {
		return c.JSON(http.StatusNotFound, response.ErrorResponse("fundraiser not found"))
	}

	commissions, err := h.commissionRepo.FindByUser(fundraiser.UserID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, response.ErrorResponse("failed to fetch commissions"))
	}

	totalCommission, err := h.commissionRepo.SumByUser(fundraiser.UserID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, response.ErrorResponse("failed to sum commissions"))
	}

	data := map[string]interface{}{
		"fundraiser":       fundraiser,
		"commissions":      commissions,
		"total_commission": totalCommission,
	}

	return c.JSON(http.StatusOK, response.SuccessResponse(data, "success"))
}

// Create invites a fundraiser to a campaign. It find-or-creates the fundraiser USER (by
// email) and then creates the Fundraiser AFFILIATE record tying that user to the campaign.
// This is what "Undang Fundraiser" should have done — it previously only created the user,
// so the affiliate list (and referral stats) stayed empty.
func (h *FundraiserHandler) Create(c echo.Context) error {
	var req request.CreateFundraiserRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, response.ErrorResponse("invalid request body"))
	}
	if err := c.Validate(&req); err != nil {
		return c.JSON(http.StatusUnprocessableEntity, response.ErrorResponse(response.ValidationMessage(err)))
	}

	// Reuse an existing user with this email if present; else create a fundraiser user.
	user, _ := h.userRepo.FindByEmail(strings.TrimSpace(req.Email))
	if user == nil {
		created, err := h.userService.Create(&request.CreateUserRequest{
			Name: req.Name, Email: req.Email, Phone: req.Phone, Password: req.Password, Role: "fundraiser",
		})
		if err != nil {
			return c.JSON(http.StatusBadRequest, response.ErrorResponse(err.Error()))
		}
		user = created
	} else if user.Role != "fundraiser" {
		return c.JSON(http.StatusConflict, response.ErrorResponse("email sudah terdaftar dengan role lain"))
	}

	// Don't duplicate the affiliate record if this user is already a fundraiser here.
	if existing, _ := h.fundraiserRepo.FindByUserAndCampaign(user.ID, req.CampaignID); existing != nil {
		return c.JSON(http.StatusConflict, response.ErrorResponse("fundraiser ini sudah terdaftar di campaign tersebut"))
	}

	f := model.Fundraiser{UserID: user.ID, CampaignID: req.CampaignID}
	if err := h.fundraiserRepo.Create(&f); err != nil {
		return c.JSON(http.StatusBadRequest, response.ErrorResponse(err.Error()))
	}

	return c.JSON(http.StatusCreated, response.SuccessResponse(map[string]interface{}{
		"fundraiser": f,
		"user":       map[string]interface{}{"id": user.ID, "name": user.Name, "email": user.Email},
	}, "fundraiser created"))
}

// RefHit records a click on a fundraiser share link. Public + best-effort: it resolves the
// ref (username or legacy UUID) to a fundraiser and bumps that campaign's total_clicks.
// Always returns 200 (even when the ref doesn't resolve) so share traffic is never blocked
// and bots can't probe which refs are valid.
func (h *FundraiserHandler) RefHit(c echo.Context) error {
	var req request.RefHitRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusOK, response.SuccessResponse(nil, "ok"))
	}
	if err := c.Validate(&req); err != nil {
		return c.JSON(http.StatusOK, response.SuccessResponse(nil, "ok"))
	}

	code := strings.TrimSpace(req.Ref)
	var user *model.User
	if id, err := uuid.Parse(code); err == nil {
		user, _ = h.userRepo.FindByID(id)
	}
	if user == nil {
		user, _ = h.userRepo.FindByUsername(strings.ToLower(code))
	}
	if user != nil && user.CanFundraise() {
		h.fundraiserRepo.IncrementClicks(user.ID, req.CampaignID)
	}
	return c.JSON(http.StatusOK, response.SuccessResponse(nil, "ok"))
}

// GetMine returns the calling fundraiser's own affiliate records (per campaign) plus their
// commission history and available bonus balance — the data backing the fundraiser portal.
func (h *FundraiserHandler) GetMine(c echo.Context) error {
	claims := middleware.GetUserFromContext(c)
	if claims == nil {
		return c.JSON(http.StatusUnauthorized, response.ErrorResponse("unauthorized"))
	}

	fundraisers, err := h.fundraiserRepo.FindByUser(claims.UserID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, response.ErrorResponse("failed to fetch fundraiser data"))
	}
	commissions, _ := h.commissionRepo.FindByUser(claims.UserID)
	totalCommission, _ := h.commissionRepo.SumByUser(claims.UserID)

	user, err := h.userRepo.FindByID(claims.UserID)
	if err != nil {
		return c.JSON(http.StatusNotFound, response.ErrorResponse("user not found"))
	}

	return c.JSON(http.StatusOK, response.SuccessResponse(map[string]interface{}{
		"fundraisers":      fundraisers,
		"commissions":      commissions,
		"total_commission": totalCommission,
		"bonus_balance":    user.BonusBalance,
		"bonus_withdrawn":  user.BonusWithdrawn,
	}, "success"))
}
