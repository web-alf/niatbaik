package response

import (
	"math"
	"time"

	"github.com/anrdart/niatbaik-api/internal/model"
	"github.com/google/uuid"
)

type CampaignListItem struct {
	ID                 uuid.UUID `json:"id"`
	Title              string    `json:"title"`
	Slug               string    `json:"slug"`
	ShortDescription   string    `json:"short_description"`
	Image              string    `json:"image"`
	Target             int64     `json:"target"`
	TotalRaised        int64     `json:"total_raised"`
	DonorCount         int64     `json:"donor_count"`
	DaysLeft           int       `json:"days_left"`
	Status             string    `json:"status"`
	Category           string    `json:"category"`
	ProgressPercentage float64   `json:"progress_percentage"`
	Featured           bool      `json:"featured"`
	CreatedAt          time.Time `json:"created_at"`
}

type CampaignDetail struct {
	ID                 uuid.UUID            `json:"id"`
	Title              string               `json:"title"`
	Slug               string               `json:"slug"`
	ShortDescription   string               `json:"short_description"`
	Description        string               `json:"description"`
	Image              string               `json:"image"`
	Target             int64                `json:"target"`
	TotalRaised        int64                `json:"total_raised"`
	DonorCount         int64                `json:"donor_count"`
	DaysLeft           int                  `json:"days_left"`
	Status             string               `json:"status"`
	Category           string               `json:"category"`
	ProgressPercentage float64              `json:"progress_percentage"`
	Featured           bool                 `json:"featured"`
	CreatedAt          time.Time            `json:"created_at"`
	User               CampaignUser         `json:"user"`
	Updates            []CampaignUpdateItem `json:"updates"`
	Donors             []CampaignDonor      `json:"donors"`
}

type CampaignUser struct {
	Name  string `json:"name"`
	Image string `json:"image"`
}

type CampaignDonor struct {
	Name        string    `json:"name"`
	Amount      int64     `json:"amount"`
	IsAnonymous bool      `json:"is_anonymous"`
	CreatedAt   time.Time `json:"created_at"`
}

type CampaignUpdateItem struct {
	Title     string    `json:"title"`
	Body      string    `json:"body"`
	Image     string    `json:"image"`
	CreatedAt time.Time `json:"created_at"`
}

func daysLeft(c *model.Campaign) int {
	if c.PostedAt == nil || c.DurationDays <= 0 {
		return 0
	}
	end := c.PostedAt.AddDate(0, 0, c.DurationDays)
	d := int(math.Ceil(time.Until(end).Hours() / 24))
	if d < 0 {
		return 0
	}
	return d
}

func ToCampaignListItem(c *model.Campaign, donorCount int64) CampaignListItem {
	cat := ""
	if c.Category != nil {
		cat = c.Category.Name
	}
	return CampaignListItem{
		ID:                 c.ID,
		Title:              c.Title,
		Slug:               c.Slug,
		ShortDescription:   c.ShortDescription,
		Image:              c.Image,
		Target:             c.Target,
		TotalRaised:        c.TotalRaised,
		DonorCount:         donorCount,
		DaysLeft:           daysLeft(c),
		Status:             c.Status,
		Category:           cat,
		ProgressPercentage: c.ProgressPercentage(),
		Featured:           c.Featured,
		CreatedAt:          c.CreatedAt,
	}
}

func ToCampaignDetail(c *model.Campaign, donorCount int64, donors []CampaignDonor, updates []CampaignUpdateItem) CampaignDetail {
	cat := ""
	if c.Category != nil {
		cat = c.Category.Name
	}
	return CampaignDetail{
		ID:                 c.ID,
		Title:              c.Title,
		Slug:               c.Slug,
		ShortDescription:   c.ShortDescription,
		Description:        c.Description,
		Image:              c.Image,
		Target:             c.Target,
		TotalRaised:        c.TotalRaised,
		DonorCount:         donorCount,
		DaysLeft:           daysLeft(c),
		Status:             c.Status,
		Category:           cat,
		ProgressPercentage: c.ProgressPercentage(),
		Featured:           c.Featured,
		CreatedAt:          c.CreatedAt,
		User: CampaignUser{
			Name:  c.User.Name,
			Image: c.User.Image,
		},
		Updates: updates,
		Donors:  donors,
	}
}
