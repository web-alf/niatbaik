package service

import (
	"errors"
	"fmt"
	"log"
	"time"

	"github.com/anrdart/niatbaik-api/internal/config"
	"github.com/anrdart/niatbaik-api/internal/dto/request"
	"github.com/anrdart/niatbaik-api/internal/dto/response"
	"github.com/anrdart/niatbaik-api/internal/model"
	"github.com/anrdart/niatbaik-api/pkg/hash"
	jwtpkg "github.com/anrdart/niatbaik-api/pkg/jwt"
	"github.com/anrdart/niatbaik-api/pkg/mailer"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type AuthService struct {
	db  *gorm.DB
	cfg *config.Config
}

func NewAuthService(db *gorm.DB, cfg *config.Config) *AuthService {
	return &AuthService{db: db, cfg: cfg}
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

	// Record login history
	history := model.LoginHistory{
		UserID:    user.ID,
		IP:        ip,
		UserAgent: userAgent,
	}
	s.db.Create(&history)

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
	s.db.Model(&model.User{}).Where("email = ?", req.Email).Count(&count)
	if count > 0 {
		return nil, errors.New("email already registered")
	}

	if req.Phone != "" {
		var phoneCount int64
		s.db.Model(&model.User{}).Where("phone = ?", req.Phone).Count(&phoneCount)
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

	if err := s.db.Create(&user).Error; err != nil {
		return nil, err
	}

	return userToResponse(&user), nil
}

func (s *AuthService) RefreshToken(refreshToken string) (*response.TokenResponse, error) {
	claims, err := jwtpkg.ParseToken(refreshToken, s.cfg.JWTSecret)
	if err != nil {
		return nil, errors.New("invalid or expired refresh token")
	}

	accessToken, err := jwtpkg.GenerateAccessToken(
		claims.UserID, claims.Email, claims.Role,
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
		resetURL := fmt.Sprintf("https://donasi.niatbaik.org/reset-password?email=%s&token=%s", user.Email, token)
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

	var user model.User
	if err := s.db.Where("email = ? AND reset_token = ?", req.Email, req.Token).First(&user).Error; err != nil {
		return errors.New("invalid reset token")
	}

	if user.ResetTokenExpiry == nil || user.ResetTokenExpiry.Before(time.Now()) {
		return errors.New("reset token expired")
	}

	hashed, err := hash.HashPassword(req.Password)
	if err != nil {
		return err
	}

	user.Password = hashed
	user.ResetToken = ""
	user.ResetTokenExpiry = nil

	return s.db.Save(&user).Error
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

func userToResponse(u *model.User) *response.UserResponse {
	phone := ""
	if u.Phone != nil {
		phone = *u.Phone
	}
	return &response.UserResponse{
		ID:                 u.ID,
		Name:               u.Name,
		Email:              u.Email,
		Phone:              phone,
		Role:               u.Role,
		Image:              u.Image,
		VerificationStatus: u.VerificationStatus,
		CreatedAt:          u.CreatedAt,
	}
}
