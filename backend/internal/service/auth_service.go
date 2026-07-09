package service

import (
	"errors"
	"fmt"
	"log"
	"net/url"
	"strings"
	"time"

	"github.com/anrdart/niatbaik-api/internal/config"
	"github.com/anrdart/niatbaik-api/internal/dto/request"
	"github.com/anrdart/niatbaik-api/internal/dto/response"
	"github.com/anrdart/niatbaik-api/internal/model"
	"github.com/anrdart/niatbaik-api/internal/repository"
	"github.com/anrdart/niatbaik-api/pkg/hash"
	jwtpkg "github.com/anrdart/niatbaik-api/pkg/jwt"
	"github.com/anrdart/niatbaik-api/pkg/mailer"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type AuthService struct {
	db          *gorm.DB
	cfg         *config.Config
	revokedRepo *repository.RevokedTokenRepo
}

func NewAuthService(db *gorm.DB, cfg *config.Config, revokedRepo *repository.RevokedTokenRepo) *AuthService {
	return &AuthService{db: db, cfg: cfg, revokedRepo: revokedRepo}
}

func (s *AuthService) Login(email, password, ip, userAgent string) (*response.TokenResponse, *response.UserResponse, error) {
	var user model.User
	if err := s.db.Where("email = ?", email).First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil, errors.New("invalid email or password")
		}
		return nil, nil, err
	}

	if !hash.CheckPassword(password, user.Password) {
		return nil, nil, errors.New("invalid email or password")
	}

	accessToken, refreshToken, err := jwtpkg.GenerateTokens(
		user.ID, user.Email, user.Role, s.cfg.JWTSecret,
		s.cfg.JWTExpiry, s.cfg.JWTRefreshExpiry,
	)
	if err != nil {
		return nil, nil, err
	}

	// Record login history (best-effort: a failure here must not block login, but
	// we log it so a broken audit trail is visible instead of silently corrupting).
	// Clearing the old is_current flag and inserting the new current row must be
	// atomic — otherwise two concurrent logins can both clear, then both insert,
	// leaving multiple is_current=true rows. Wrap them in one transaction.
	if err := s.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Model(&model.LoginHistory{}).
			Where("user_id = ? AND is_current = ?", user.ID, true).
			Update("is_current", false).Error; err != nil {
			return err
		}
		now := time.Now()
		history := model.LoginHistory{
			UserID:     user.ID,
			IP:         ip,
			UserAgent:  userAgent,
			Device:     parseDevice(userAgent),
			Location:   "",
			LoggedInAt: now,
			IsCurrent:  true,
		}
		if err := tx.Create(&history).Error; err != nil {
			return err
		}
		// Denormalized last-login on the user row so the Members admin list can show it
		// without joining LoginHistory on every page load.
		return tx.Model(&model.User{}).Where("id = ?", user.ID).Update("last_login_at", now).Error
	}); err != nil {
		log.Printf("[Login] failed to record login history for user %s: %v", user.ID, err)
	}

	tokenResp := &response.TokenResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		TokenType:    "Bearer",
		ExpiresIn:    int64(s.cfg.JWTExpiry.Seconds()),
	}

	userResp := userToResponse(&user)

	return tokenResp, userResp, nil
}

func (s *AuthService) Register(req *request.RegisterRequest) (*response.UserResponse, error) {
	if req.Password != req.PasswordConfirm {
		return nil, errors.New("passwords do not match")
	}

	var count int64
	if err := s.db.Model(&model.User{}).Where("email = ?", req.Email).Count(&count).Error; err != nil {
		return nil, err
	}
	if count > 0 {
		return nil, errors.New("email already registered")
	}

	if req.Phone != "" {
		var phoneCount int64
		if err := s.db.Model(&model.User{}).Where("phone = ?", req.Phone).Count(&phoneCount).Error; err != nil {
			return nil, err
		}
		if phoneCount > 0 {
			return nil, errors.New("nomor telepon sudah digunakan")
		}
	}

	hashed, err := hash.HashPassword(req.Password)
	if err != nil {
		return nil, err
	}

	user := model.User{
		Name:     req.Name,
		Email:    req.Email,
		Phone:    &req.Phone,
		Password: hashed,
		Role:     "user",
	}

	// The pre-checks above are a friendly fast-path, but two concurrent registrations
	// with the same email/phone can both pass them. The unique indexes on
	// users.email / users.phone are the authoritative guard: translate the resulting
	// duplicate-key violation into the same friendly message instead of a raw 500.
	if err := s.db.Create(&user).Error; err != nil {
		le := strings.ToLower(err.Error())
		if strings.Contains(le, "duplicate") || strings.Contains(le, "unique") || strings.Contains(le, "23505") {
			if strings.Contains(le, "phone") {
				return nil, errors.New("nomor telepon sudah digunakan")
			}
			return nil, errors.New("email already registered")
		}
		return nil, err
	}

	return userToResponse(&user), nil
}

func (s *AuthService) RefreshToken(refreshToken string) (*response.TokenResponse, error) {
	claims, err := jwtpkg.ParseToken(refreshToken, s.cfg.JWTSecret)
	if err != nil {
		return nil, errors.New("invalid or expired refresh token")
	}

	// Reject a refresh token that has been revoked (e.g. by logout). Treat a
	// denylist lookup error as a failure to verify rather than silently allowing.
	if s.revokedRepo != nil && claims.ID != "" {
		revoked, err := s.revokedRepo.IsRevoked(claims.ID)
		if err != nil {
			return nil, errors.New("could not verify token state")
		}
		if revoked {
			return nil, errors.New("invalid or expired refresh token")
		}
	}

	// Sign the new access token with the LIVE DB role and reject a deleted user, so the
	// refresh path is self-sufficient rather than relying solely on the JWTMiddleware to
	// scrub a stale/elevated role. Fail-closed: if the user is gone, refresh fails.
	var u model.User
	if err := s.db.Model(&model.User{}).Select("role").First(&u, "id = ?", claims.UserID).Error; err != nil {
		return nil, errors.New("invalid or expired refresh token")
	}

	accessToken, err := jwtpkg.GenerateAccessToken(
		claims.UserID, claims.Email, u.Role,
		s.cfg.JWTSecret, s.cfg.JWTExpiry,
	)
	if err != nil {
		return nil, err
	}

	return &response.TokenResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		TokenType:    "Bearer",
		ExpiresIn:    int64(s.cfg.JWTExpiry.Seconds()),
	}, nil
}

// Logout revokes the caller's access token and, when supplied, its paired refresh
// token by adding their JTIs to the denylist until natural expiry. This makes
// logout effective server-side instead of relying on the client to discard tokens.
//
// userID is the authenticated caller (from the validated access token). A supplied
// refresh token is only revoked if it belongs to the same user — this prevents an
// authenticated user from revoking someone else's session (a DoS) by passing a
// stolen/guessed refresh token. Best-effort: a denylist error on one token is
// logged but does not abort revoking the others.
func (s *AuthService) Logout(userID uuid.UUID, accessToken, refreshToken string) error {
	if s.revokedRepo == nil {
		return nil
	}
	for _, raw := range []string{accessToken, refreshToken} {
		if raw == "" {
			continue
		}
		claims, err := jwtpkg.ParseToken(raw, s.cfg.JWTSecret)
		if err != nil || claims.ID == "" || claims.ExpiresAt == nil {
			continue
		}
		// Only revoke tokens that belong to the authenticated caller.
		if claims.UserID != userID {
			continue
		}
		if err := s.revokedRepo.Revoke(claims.ID, claims.ExpiresAt.Time); err != nil {
			log.Printf("[Logout] failed to revoke token %s for user %s: %v", claims.ID, userID, err)
		}
	}
	return nil
}

func (s *AuthService) ForgotPassword(email string) error {
	var user model.User
	if err := s.db.Where("email = ?", email).First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			// Don't reveal whether email exists
			return nil
		}
		return err
	}

	token := uuid.New().String()
	expiry := time.Now().Add(1 * time.Hour)
	user.ResetToken = token
	user.ResetTokenExpiry = &expiry

	if err := s.db.Save(&user).Error; err != nil {
		return err
	}

	// Send reset email via SMTP (best-effort: log on failure, don't leak to client).
	var settings model.Setting
	if err := s.db.First(&settings).Error; err == nil {
		resetURL := fmt.Sprintf("%s/reset-password?email=%s&token=%s",
			s.cfg.FrontendBaseURL, url.QueryEscape(user.Email), url.QueryEscape(token))
		body := fmt.Sprintf(`
			<div style="font-family:sans-serif;max-width:480px;margin:auto">
			  <h2 style="color:#2E4191">Reset Password NIATBAIK.ORG</h2>
			  <p>Halo %s,</p>
			  <p>Kami menerima permintaan reset password untuk akun Anda. Klik tombol di bawah untuk membuat password baru. Tautan berlaku 1 jam.</p>
			  <p style="text-align:center;margin:24px 0">
			    <a href="%s" style="background:#2E4191;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">Reset Password</a>
			  </p>
			  <p style="color:#64748B;font-size:13px">Jika Anda tidak meminta ini, abaikan email ini.</p>
			</div>`, user.Name, resetURL)

		cfg := mailer.Config{
			Host:     settings.SMTPHost,
			Port:     settings.SMTPPort,
			Email:    settings.SMTPEmail,
			Password: settings.SMTPPassword,
			Name:     settings.SMTPName,
		}
		if err := mailer.Send(cfg, user.Email, "Reset Password NIATBAIK.ORG", body); err != nil {
			log.Printf("[ForgotPassword] failed to send email to %s: %v", user.Email, err)
		}
	}

	return nil
}

func (s *AuthService) ResetPassword(req *request.ResetPasswordRequest) error {
	if req.Password != req.PasswordConfirm {
		return errors.New("passwords do not match")
	}

	// Empty token must never match a user whose reset_token was cleared.
	if req.Token == "" {
		return errors.New("invalid reset token")
	}

	hashed, err := hash.HashPassword(req.Password)
	if err != nil {
		return err
	}

	// Atomic single-use consume: only the row that still holds this exact, unexpired
	// token is updated, and the token is cleared in the same statement. Concurrent
	// requests with the same token race on this UPDATE — exactly one affects a row.
	result := s.db.Model(&model.User{}).
		Where("email = ? AND reset_token = ? AND reset_token_expiry > ?", req.Email, req.Token, time.Now()).
		Updates(map[string]interface{}{
			"password":            hashed,
			"reset_token":         "",
			"reset_token_expiry":  nil,
			// Invalidate every access/refresh token issued before this reset: the JWT
			// middleware rejects tokens whose IssuedAt predates password_changed_at, so a
			// thief holding a still-valid refresh token can't keep minting access tokens
			// after the victim resets their password.
			"password_changed_at": time.Now(),
		})
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return errors.New("invalid or expired reset token")
	}
	return nil
}

func (s *AuthService) GetUserByID(id uuid.UUID) (*response.UserResponse, error) {
	var user model.User
	if err := s.db.First(&user, "id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("user not found")
		}
		return nil, err
	}
	return userToResponse(&user), nil
}

func parseDevice(ua string) string {
	c := strings.Contains
	browser := "Unknown"
	os := "Unknown"
	if c(ua, "Chrome") && !c(ua, "Edg") {
		browser = "Chrome"
	} else if c(ua, "Edg") {
		browser = "Edge"
	} else if c(ua, "Firefox") {
		browser = "Firefox"
	} else if c(ua, "Safari") && !c(ua, "Chrome") {
		browser = "Safari"
	}
	if c(ua, "Windows") {
		os = "Windows"
	} else if c(ua, "Macintosh") || c(ua, "Mac OS") {
		os = "macOS"
	} else if c(ua, "Linux") && !c(ua, "Android") {
		os = "Linux"
	} else if c(ua, "Android") {
		os = "Android"
	} else if c(ua, "iPhone") || c(ua, "iPad") {
		os = "iOS"
	}
	return browser + " · " + os
}

func userToResponse(u *model.User) *response.UserResponse {
	phone := ""
	if u.Phone != nil {
		phone = *u.Phone
	}
	uname := ""
	if u.Username != nil {
		uname = *u.Username
	}
	return &response.UserResponse{
		ID:                 u.ID,
		Name:               u.Name,
		Email:              u.Email,
		Phone:              phone,
		Username:           uname,
		Role:               u.Role,
		Image:              u.Image,
		LastLoginAt:        u.LastLoginAt,
		UsernameChangedAt:  u.UsernameChangedAt,
		CreatedAt:          u.CreatedAt,
		BonusBalance:       u.BonusBalance,
		BonusWithdrawn:     u.BonusWithdrawn,
		FundraiserEnabled:  u.FundraiserEnabled,
	}
}
