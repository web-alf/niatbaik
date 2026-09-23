package handler

import (
	"fmt"
	"log"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/anrdart/niatbaik-api/internal/config"
	"github.com/anrdart/niatbaik-api/internal/dto/request"
	"github.com/anrdart/niatbaik-api/internal/dto/response"
	"github.com/anrdart/niatbaik-api/internal/middleware"
	"github.com/anrdart/niatbaik-api/internal/model"
	"github.com/anrdart/niatbaik-api/internal/repository"
	"github.com/anrdart/niatbaik-api/internal/service"
	"github.com/anrdart/niatbaik-api/pkg/hash"
	"github.com/anrdart/niatbaik-api/pkg/mailer"
	"github.com/anrdart/niatbaik-api/pkg/pagination"
	"github.com/anrdart/niatbaik-api/pkg/username"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

type FundraiserHandler struct {
	fundraiserRepo *repository.FundraiserRepo
	commissionRepo *repository.CommissionRepo
	userRepo       *repository.UserRepo
	userService    *service.UserService
	settingRepo    *repository.SettingRepo
	cfg            *config.Config
}

func NewFundraiserHandler(fundraiserRepo *repository.FundraiserRepo, commissionRepo *repository.CommissionRepo, userRepo *repository.UserRepo, userService *service.UserService, settingRepo *repository.SettingRepo, cfg *config.Config) *FundraiserHandler {
	return &FundraiserHandler{
		fundraiserRepo: fundraiserRepo,
		commissionRepo: commissionRepo,
		userRepo:       userRepo,
		userService:    userService,
		settingRepo:    settingRepo,
		cfg:            cfg,
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

// Register is the public self-service fundraiser signup: creates the user (unverified) and
// the affiliate record immediately (so it shows as "pending" in the admin list), then emails
// a verification link. No credentials are usable until VerifyEmail is called — the user's
// initial password is a throwaway random value, replaced by a freshly generated one on verify.
func (h *FundraiserHandler) Register(c echo.Context) error {
	var req request.RegisterFundraiserRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, response.ErrorResponse("invalid request body"))
	}
	if err := c.Validate(&req); err != nil {
		return c.JSON(http.StatusUnprocessableEntity, response.ErrorResponse(response.ValidationMessage(err)))
	}

	email := strings.TrimSpace(strings.ToLower(req.Email))
	user, _ := h.userRepo.FindByEmail(email)
	if user != nil {
		return c.JSON(http.StatusConflict, response.ErrorResponse("email sudah terdaftar"))
	}

	throwaway, err := hash.GenerateRandomPassword(24)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, response.ErrorResponse("failed to register"))
	}
	hashed, err := hash.HashPassword(throwaway)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, response.ErrorResponse("failed to register"))
	}
	// Random 8-char code, not derived from email — referral handles shouldn't leak or let
	// anyone guess the address, and short codes look cleaner in share links (?ref=k7m2p9qz).
	uname := username.GenerateRandomCode(func(u string) bool { return h.userRepo.UsernameTaken(u, uuid.Nil) })

	token := uuid.New().String()
	expiry := time.Now().Add(48 * time.Hour)
	u := model.User{
		Name: req.Name, Email: email, Username: &uname, Password: hashed, Role: "fundraiser",
		ResetToken: token, ResetTokenExpiry: &expiry,
	}
	if req.Phone != "" {
		u.Phone = &req.Phone
	}
	if err := h.userRepo.Create(&u); err != nil {
		return c.JSON(http.StatusBadRequest, response.ErrorResponse("gagal mendaftar, coba lagi"))
	}

	if existing, _ := h.fundraiserRepo.FindByUserAndCampaign(u.ID, req.CampaignID); existing == nil {
		f := model.Fundraiser{UserID: u.ID, CampaignID: req.CampaignID}
		if err := h.fundraiserRepo.Create(&f); err != nil {
			return c.JSON(http.StatusBadRequest, response.ErrorResponse(err.Error()))
		}
	}

	h.sendVerificationEmail(&u, token)

	return c.JSON(http.StatusCreated, response.SuccessResponse(nil, "pendaftaran berhasil, silakan cek email untuk verifikasi"))
}

// VerifyEmail consumes the emailed token: activates the fundraiser (email_verified_at) and
// rotates in a fresh, emailed password, atomically and single-use (mirrors AuthService.ResetPassword).
func (h *FundraiserHandler) VerifyEmail(c echo.Context) error {
	var req request.VerifyFundraiserEmailRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, response.ErrorResponse("invalid request body"))
	}
	if err := c.Validate(&req); err != nil {
		return c.JSON(http.StatusUnprocessableEntity, response.ErrorResponse(response.ValidationMessage(err)))
	}

	newPassword, err := hash.GenerateRandomPassword(12)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, response.ErrorResponse("failed to verify"))
	}
	hashed, err := hash.HashPassword(newPassword)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, response.ErrorResponse("failed to verify"))
	}

	email := strings.TrimSpace(strings.ToLower(req.Email))
	ok, err := h.userRepo.VerifyEmailAndSetPassword(email, req.Token, hashed)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, response.ErrorResponse("failed to verify"))
	}
	if !ok {
		return c.JSON(http.StatusBadRequest, response.ErrorResponse("link verifikasi tidak valid atau sudah kedaluwarsa"))
	}

	if u, err := h.userRepo.FindByEmail(email); err == nil {
		h.userService.SendCredentialsEmail(u, newPassword)
	}

	return c.JSON(http.StatusOK, response.SuccessResponse(nil, "email berhasil diverifikasi"))
}

// sendVerificationEmail sends the "confirm your email" link for self-registration. Best-effort:
// skipped when SMTP isn't configured, logs on failure, never fails the registration itself.
func (h *FundraiserHandler) sendVerificationEmail(u *model.User, token string) {
	if h.settingRepo == nil {
		return
	}
	settings, err := h.settingRepo.Get()
	if err != nil || settings == nil || settings.SMTPHost == "" {
		return
	}

	verifyURL := fmt.Sprintf("%s/verify-fundraiser-email?email=%s&token=%s",
		h.cfg.FrontendBaseURL, url.QueryEscape(u.Email), url.QueryEscape(token))
	body := fmt.Sprintf(`
		<div style="font-family:sans-serif;max-width:480px;margin:auto">
		  <h2 style="color:#2E4191">Verifikasi Pendaftaran Fundraiser</h2>
		  <p>Halo %s,</p>
		  <p>Terima kasih telah mendaftar sebagai fundraiser NIATBAIK.ORG. Klik tombol di bawah untuk memverifikasi email Anda dan mengaktifkan akun. Tautan berlaku 48 jam.</p>
		  <p style="text-align:center;margin:24px 0">
		    <a href="%s" style="background:#2E4191;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">Verifikasi Email</a>
		  </p>
		  <p style="color:#64748B;font-size:13px">Jika Anda tidak merasa mendaftar, abaikan email ini.</p>
		</div>`, u.Name, verifyURL)

	cfg := mailer.Config{Host: settings.SMTPHost, Port: settings.SMTPPort, Email: settings.SMTPEmail, Password: settings.SMTPPassword, Name: settings.SMTPName}
	if err := mailer.SendImportant(cfg, u.Email, "Verifikasi Email Fundraiser NIATBAIK.ORG", body); err != nil {
		log.Printf("[FundraiserHandler.Register] failed to send verification email to %s: %v", u.Email, err)
	}
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
