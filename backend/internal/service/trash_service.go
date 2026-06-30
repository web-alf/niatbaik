package service

import (
	"errors"
	"time"

	"github.com/anrdart/niatbaik-api/internal/repository"
	"github.com/google/uuid"
)

type TrashService struct {
	trashRepo *repository.TrashRepo
}

func NewTrashService(trashRepo *repository.TrashRepo) *TrashService {
	return &TrashService{trashRepo: trashRepo}
}

// TrashItem is a flat, type-tagged trash row. A single array (not a
// {campaigns,users} object) lets the frontend iterate directly, and DeletedAt is
// exposed explicitly here (the models tag it json:"-") so the UI can show the
// 30-day retention countdown.
type TrashItem struct {
	ID        uuid.UUID  `json:"id"`
	Type      string     `json:"type"`   // "campaign" | "user"
	Name      string     `json:"name"`   // campaign title / user name
	Detail    string     `json:"detail"` // secondary line (slug / email)
	DeletedAt *time.Time `json:"deleted_at"`
}

func (s *TrashService) GetAll() ([]TrashItem, error) {
	campaigns, err := s.trashRepo.FindDeletedCampaigns()
	if err != nil {
		return nil, err
	}
	users, err := s.trashRepo.FindDeletedUsers()
	if err != nil {
		return nil, err
	}

	items := make([]TrashItem, 0, len(campaigns)+len(users))
	for _, c := range campaigns {
		var del *time.Time
		if c.DeletedAt.Valid {
			t := c.DeletedAt.Time
			del = &t
		}
		items = append(items, TrashItem{ID: c.ID, Type: "campaign", Name: c.Title, Detail: c.Slug, DeletedAt: del})
	}
	for _, u := range users {
		var del *time.Time
		if u.DeletedAt.Valid {
			t := u.DeletedAt.Time
			del = &t
		}
		items = append(items, TrashItem{ID: u.ID, Type: "user", Name: u.Name, Detail: u.Email, DeletedAt: del})
	}
	return items, nil
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
