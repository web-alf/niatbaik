package service

import (
	"errors"

	"github.com/anrdart/niatbaik-api/internal/model"
	"github.com/anrdart/niatbaik-api/internal/repository"
	"github.com/google/uuid"
)

type TrashService struct {
	trashRepo *repository.TrashRepo
}

func NewTrashService(trashRepo *repository.TrashRepo) *TrashService {
	return &TrashService{trashRepo: trashRepo}
}

type TrashData struct {
	Campaigns []model.Campaign `json:"campaigns"`
	Users     []model.User     `json:"users"`
}

func (s *TrashService) GetAll() (*TrashData, error) {
	campaigns, err := s.trashRepo.FindDeletedCampaigns()
	if err != nil {
		return nil, err
	}

	users, err := s.trashRepo.FindDeletedUsers()
	if err != nil {
		return nil, err
	}

	return &TrashData{
		Campaigns: campaigns,
		Users:     users,
	}, nil
}

func (s *TrashService) Restore(itemType string, id uuid.UUID) error {
	switch itemType {
	case "campaign":
		return s.trashRepo.RestoreCampaign(id)
	case "user":
		return s.trashRepo.RestoreUser(id)
	default:
		return errors.New("invalid item type")
	}
}

func (s *TrashService) PermanentDelete(itemType string, id uuid.UUID) error {
	switch itemType {
	case "campaign":
		return s.trashRepo.PermanentDeleteCampaign(id)
	case "user":
		return s.trashRepo.PermanentDeleteUser(id)
	default:
		return errors.New("invalid item type")
	}
}
