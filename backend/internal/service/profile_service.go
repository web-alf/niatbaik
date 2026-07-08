package service

import (
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/anrdart/niatbaik-api/internal/dto/request"
	"github.com/anrdart/niatbaik-api/internal/model"
	"github.com/anrdart/niatbaik-api/internal/repository"
	"github.com/anrdart/niatbaik-api/pkg/hash"
	"github.com/anrdart/niatbaik-api/pkg/username"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ProfileService struct {
	db           *gorm.DB
	activityRepo *repository.ActivityRepo
}

func NewProfileService(db *gorm.DB, activityRepo *repository.ActivityRepo) *ProfileService {
	return &ProfileService{db: db, activityRepo: activityRepo}
}

func (s *ProfileService) GetProfile(userID uuid.UUID) (*model.User, error) {
	var user model.User
	if err := s.db.First(&user, "id = ?", userID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("user not found")
		}
		return nil, err
	}
	return &user, nil
}

// UsernameCooldownDays is the minimum gap between self-service username changes for
// non-admin users. Admins bypass it (see callerRole handling below).
const UsernameCooldownDays = 30

// UpdateProfile applies the profile patch. callerRole gates the username-rename cooldown:
// "admin" bypasses it. Validation/cooldown/uniqueness failures return a user-facing error
// (the handler surfaces the message), so this must run BEFORE any write.
func (s *ProfileService) UpdateProfile(userID uuid.UUID, callerRole string, req *request.UpdateProfileRequest) error {
	updates := map[string]interface{}{}
	if req.Name != "" {
		updates["name"] = req.Name
	}
	if req.Phone != "" {
		var count int64
		if err := s.db.Model(&model.User{}).Where("phone = ? AND id != ?", req.Phone, userID).Count(&count).Error; err != nil {
			return err
		}
		if count > 0 {
			return errors.New("nomor telepon sudah digunakan oleh pengguna lain")
		}
		updates["phone"] = req.Phone
	}
	// Username: normalize → validate → cooldown (non-admin) → uniqueness. Only applied when
	// the value actually differs from the stored one, so re-saving the profile with the same
	// username never trips the cooldown.
	if strings.TrimSpace(req.Username) != "" {
		uname := username.Normalize(req.Username)
		if err := username.Validate(uname); err != nil {
			return err
		}
		var current model.User
		if err := s.db.Select("username", "username_changed_at").First(&current, "id = ?", userID).Error; err != nil {
			return err
		}
		curUname := ""
		if current.Username != nil {
			curUname = *current.Username
		}
		if uname != curUname {
			if callerRole != "admin" && current.UsernameChangedAt != nil {
				nextAllowed := current.UsernameChangedAt.Add(UsernameCooldownDays * 24 * time.Hour)
				if time.Now().Before(nextAllowed) {
					remaining := int(time.Until(nextAllowed).Hours()/24) + 1
					return fmt.Errorf("username hanya dapat diubah setiap %d hari (sisa %d hari)", UsernameCooldownDays, remaining)
				}
			}
			var count int64
			if err := s.db.Model(&model.User{}).Where("username = ? AND id != ?", uname, userID).Count(&count).Error; err != nil {
				return err
			}
			if count > 0 {
				return errors.New("username sudah digunakan oleh pengguna lain")
			}
			updates["username"] = uname
			updates["username_changed_at"] = time.Now()
		}
	}
	if req.Address != "" {
		updates["address"] = req.Address
	}
	if req.Bio != "" {
		updates["bio"] = req.Bio
	}
	// Avatar: pointer field, so nil = leave unchanged, "" = clear, value = set. This is
	// the path returned by /uploads/image (persisted on the api-uploads volume), NOT a
	// base64 blob — so it survives reload and doesn't bloat the row.
	if req.Image != nil {
		updates["image"] = *req.Image
	}
	if len(updates) == 0 {
		return nil
	}
	return s.db.Model(&model.User{}).Where("id = ?", userID).Updates(updates).Error
}

func (s *ProfileService) ChangePassword(userID uuid.UUID, req *request.ChangePasswordRequest) error {
	if req.NewPassword != req.PasswordConfirm {
		return errors.New("passwords do not match")
	}

	var user model.User
	if err := s.db.First(&user, "id = ?", userID).Error; err != nil {
		return errors.New("user not found")
	}

	if !hash.CheckPassword(req.CurrentPassword, user.Password) {
		return errors.New("current password is incorrect")
	}

	hashed, err := hash.HashPassword(req.NewPassword)
	if err != nil {
		return err
	}

	return s.db.Model(&user).Update("password", hashed).Error
}

func (s *ProfileService) GetActivityLog(userID uuid.UUID) ([]model.ActivityLog, error) {
	return s.activityRepo.FindByUser(userID, 50)
}

func (s *ProfileService) GetLoginHistory(userID uuid.UUID) ([]model.LoginHistory, error) {
	return s.activityRepo.FindLoginHistory(userID, 50)
}

func (s *ProfileService) LogActivity(userID uuid.UUID, action, description, ip, userAgent string) error {
	log := &model.ActivityLog{
		UserID:      userID,
		Action:      action,
		Description: description,
		IP:          ip,
		UserAgent:   userAgent,
	}
	return s.activityRepo.Create(log)
}
