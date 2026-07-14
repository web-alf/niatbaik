package service

import (
	"errors"
	"strconv"
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
	Type      string     `json:"type"`   // "campaign" | "user" | "transaction"
	Name      string     `json:"name"`   // campaign title / user name / invoice number
	Detail    string     `json:"detail"` // secondary line (slug / email / campaign · nominal)
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
	invoices, err := s.trashRepo.FindDeletedInvoices()
	if err != nil {
		return nil, err
	}

	items := make([]TrashItem, 0, len(campaigns)+len(users)+len(invoices))
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
	for _, inv := range invoices {
		var del *time.Time
		if inv.DeletedAt.Valid {
			t := inv.DeletedAt.Time
			del = &t
		}
		// Detail = program + nominal so a trashed lead is identifiable without opening it.
		detail := inv.Campaign.Title
		if detail != "" {
			detail += " · "
		}
		detail += "Rp " + formatThousands(inv.Total)
		items = append(items, TrashItem{ID: inv.ID, Type: "transaction", Name: inv.InvoiceNumber, Detail: detail, DeletedAt: del})
	}
	return items, nil
}

// formatThousands renders an int64 rupiah amount with dot thousand-separators
// (1234567 → "1.234.567") for the Trash detail line.
func formatThousands(n int64) string {
	neg := n < 0
	if neg {
		n = -n
	}
	digits := strconv.FormatInt(n, 10)
	var out []byte
	for i, c := range []byte(digits) {
		if i > 0 && (len(digits)-i)%3 == 0 {
			out = append(out, '.')
		}
		out = append(out, c)
	}
	if neg {
		return "-" + string(out)
	}
	return string(out)
}

func (s *TrashService) Restore(itemType string, id uuid.UUID) error {
	switch itemType {
	case "campaign":
		return s.trashRepo.RestoreCampaign(id)
	case "user":
		return s.trashRepo.RestoreUser(id)
	case "transaction":
		return s.trashRepo.RestoreInvoice(id)
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
	case "transaction":
		return s.trashRepo.PermanentDeleteInvoice(id)
	default:
		return errors.New("invalid item type")
	}
}
