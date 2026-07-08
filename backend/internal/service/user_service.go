package service

import (
	"errors"
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/anrdart/niatbaik-api/internal/dto/request"
	"github.com/anrdart/niatbaik-api/internal/model"
	"github.com/anrdart/niatbaik-api/internal/repository"
	"github.com/anrdart/niatbaik-api/pkg/hash"
	"github.com/anrdart/niatbaik-api/pkg/mailer"
	"github.com/anrdart/niatbaik-api/pkg/username"
	"github.com/google/uuid"
)

type UserService struct {
	userRepo    *repository.UserRepo
	settingRepo *repository.SettingRepo
}

func NewUserService(userRepo *repository.UserRepo, settingRepo *repository.SettingRepo) *UserService {
	return &UserService{userRepo: userRepo, settingRepo: settingRepo}
}

func (s *UserService) Create(req *request.CreateUserRequest) (*model.User, error) {
	existing, _ := s.userRepo.FindByEmail(req.Email)
	if existing != nil {
		return nil, errors.New("email already registered")
	}

	hashed, err := hash.HashPassword(req.Password)
	if err != nil {
		return nil, err
	}

	// Resolve the username: an explicit one (validated + unique) or auto-generated from the
	// email local-part. Every user gets a handle so referral links (?ref=<username>) work.
	uname, err := s.resolveNewUsername(req.Username, req.Email, req.Name)
	if err != nil {
		return nil, err
	}

	u := model.User{
		Name:     req.Name,
		Email:    req.Email,
		Username: &uname,
		Password: hashed,
		Role:     req.Role,
	}
	if req.Phone != "" {
		u.Phone = &req.Phone
	}

	if err := s.userRepo.Create(&u); err != nil {
		return nil, err
	}

	// Best-effort welcome/invite email with login info (only if SMTP configured).
	s.sendInviteEmail(&u, req.Password)

	return &u, nil
}

// sendInviteEmail notifies a freshly-created user of their login credentials.
// Best-effort: skipped when SMTP not configured, logs on failure, never fails creation.
func (s *UserService) sendInviteEmail(u *model.User, plainPassword string) {
	if s.settingRepo == nil {
		return
	}
	settings, err := s.settingRepo.Get()
	if err != nil || settings == nil || settings.SMTPHost == "" {
		return
	}

	loginURL := "https://donasi.niatbaik.org/login"
	body := fmt.Sprintf(`
		<div style="font-family:sans-serif;max-width:480px;margin:auto">
		  <h2 style="color:#2E4191">Selamat Datang di NIATBAIK.ORG</h2>
		  <p>Halo %s,</p>
		  <p>Akun Anda telah dibuat oleh admin. Berikut detail login Anda:</p>
		  <p style="background:#F1F5F9;padding:12px 16px;border-radius:8px">
		    <strong>Email:</strong> %s<br>
		    <strong>Password:</strong> %s
		  </p>
		  <p>Silakan login dan segera ganti password Anda demi keamanan.</p>
		  <p style="text-align:center;margin:24px 0">
		    <a href="%s" style="background:#2E4191;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">Login Sekarang</a>
		  </p>
		  <p style="color:#64748B;font-size:13px">Jika Anda tidak merasa mendaftar, abaikan email ini.</p>
		</div>`, u.Name, u.Email, plainPassword, loginURL)

	cfg := mailer.Config{
		Host:     settings.SMTPHost,
		Port:     settings.SMTPPort,
		Email:    settings.SMTPEmail,
		Password: settings.SMTPPassword,
		Name:     settings.SMTPName,
	}
	if err := mailer.Send(cfg, u.Email, "Akun NIATBAIK.ORG Anda Telah Dibuat", body); err != nil {
		log.Printf("[UserService.Create] failed to send invite email to %s: %v", u.Email, err)
	}
}

func (s *UserService) Update(id uuid.UUID, req *request.UpdateUserRequest) (*model.User, error) {
	u, err := s.userRepo.FindByID(id)
	if err != nil {
		return nil, errors.New("user not found")
	}

	if req.Name != "" {
		u.Name = req.Name
	}
	if req.Email != "" {
		// check uniqueness
		existing, _ := s.userRepo.FindByEmail(req.Email)
		if existing != nil && existing.ID != u.ID {
			return nil, errors.New("email already in use")
		}
		u.Email = req.Email
	}
	if req.Phone != "" {
		u.Phone = &req.Phone
	}
	// Admin-set username: validate + enforce uniqueness, no cooldown. Only applied when it
	// differs from the current value.
	if strings.TrimSpace(req.Username) != "" {
		uname := username.Normalize(req.Username)
		if err := username.Validate(uname); err != nil {
			return nil, err
		}
		cur := ""
		if u.Username != nil {
			cur = *u.Username
		}
		if uname != cur {
			if s.userRepo.UsernameTaken(uname, u.ID) {
				return nil, errors.New("username sudah digunakan oleh pengguna lain")
			}
			now := time.Now()
			u.Username = &uname
			u.UsernameChangedAt = &now
		}
	}
	if req.Role != "" {
		u.Role = req.Role
	}
	// Admin-set password change. Optional: only when a value is sent. Hash it and stamp
	// PasswordChangedAt so the JWT middleware invalidates the user's existing sessions —
	// forcing a re-login with the new credential.
	if req.Password != "" {
		hashed, err := hash.HashPassword(req.Password)
		if err != nil {
			return nil, err
		}
		u.Password = hashed
		now := time.Now()
		u.PasswordChangedAt = &now
	}

	if err := s.userRepo.Update(u); err != nil {
		return nil, err
	}
	return u, nil
}

// resolveNewUsername validates an explicit username (unique) or, when blank, generates a
// unique one from the email local-part (fallback: name). Always returns a value satisfying
// username.Validate.
func (s *UserService) resolveNewUsername(explicit, email, name string) (string, error) {
	if strings.TrimSpace(explicit) != "" {
		uname := username.Normalize(explicit)
		if err := username.Validate(uname); err != nil {
			return "", err
		}
		if s.userRepo.UsernameTaken(uname, uuid.Nil) {
			return "", errors.New("username sudah digunakan oleh pengguna lain")
		}
		return uname, nil
	}
	seed := email
	if at := strings.IndexByte(seed, '@'); at > 0 {
		seed = seed[:at]
	}
	if strings.TrimSpace(seed) == "" {
		seed = name
	}
	return username.GenerateUnique(seed, func(c string) bool { return s.userRepo.UsernameTaken(c, uuid.Nil) }), nil
}

func (s *UserService) Delete(id uuid.UUID) error {
	_, err := s.userRepo.FindByID(id)
	if err != nil {
		return errors.New("user not found")
	}
	return s.userRepo.Delete(id)
}
