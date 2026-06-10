package service

import (
	"github.com/anrdart/niatbaik-api/internal/model"
	"github.com/anrdart/niatbaik-api/internal/repository"
	"github.com/google/uuid"
)

type NotificationService struct {
	notificationRepo *repository.NotificationRepo
}

func NewNotificationService(notificationRepo *repository.NotificationRepo) *NotificationService {
	return &NotificationService{notificationRepo: notificationRepo}
}

func (s *NotificationService) GetNotifications(userID uuid.UUID, limit int) ([]model.Notification, int64, error) {
	notifications, err := s.notificationRepo.FindByUser(userID, limit)
	if err != nil {
		return nil, 0, err
	}
	_, unreadCount, err := s.notificationRepo.FindUnread(userID)
	if err != nil {
		return nil, 0, err
	}
	return notifications, unreadCount, nil
}

func (s *NotificationService) MarkRead(notificationID, userID uuid.UUID) error {
	return s.notificationRepo.MarkRead(notificationID, userID)
}

func (s *NotificationService) MarkAllRead(userID uuid.UUID) error {
	return s.notificationRepo.MarkAllRead(userID)
}

func (s *NotificationService) CreateNotification(userID *uuid.UUID, notifType, title, subtitle string) error {
	notification := &model.Notification{
		UserID:   userID,
		Type:     notifType,
		Title:    title,
		Subtitle: subtitle,
	}
	return s.notificationRepo.Create(notification)
}
