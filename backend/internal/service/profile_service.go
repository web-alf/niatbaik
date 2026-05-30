package service

import (
	"errors"

	"github.com/anrdart/niatbaik-api/internal/dto/request"
	"github.com/anrdart/niatbaik-api/internal/model"
	"github.com/anrdart/niatbaik-api/internal/repository"
	"github.com/anrdart/niatbaik-api/pkg/hash"
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

func (s *ProfileService) UpdateProfile(userID uuid.UUID, req *request.UpdateProfileRequest) error {
	updates := map[string]interface{}{}
	if req.Name != "" {
		updates["name"] = req.Name
	}
	if req.Phone != "" {
		var count int64
		s.db.Model(&model.User{}).Where("phone = ? AND id != ?", req.Phone, userID).Count(&count)
		if count > 0 {
			return errors.New("nomor telepon sudah digunakan oleh pengguna lain")
		}
		updates["phone"] = req.Phone
	}
	if req.Address != "" {
		updates["address"] = req.Address
	}
	if req.Bio != "" {
		updates["bio"] = req.Bio
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
