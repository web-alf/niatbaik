package service

import (
	"errors"
	"path"
	"strings"
	"time"

	"github.com/anrdart/niatbaik-api/internal/dto/request"
	"github.com/anrdart/niatbaik-api/internal/model"
	"github.com/anrdart/niatbaik-api/internal/repository"
	"github.com/anrdart/niatbaik-api/pkg/slug"
	"github.com/google/uuid"
)

// sanitizeImageRef reduces a campaign image reference to a safe bare filename,
// stripping any directory/traversal components ("../", absolute or "/uploads/"
// prefixes). Uploaded images are stored as a UUID filename and served from
// /uploads/<name>, so only the final path element is ever valid here.
func sanitizeImageRef(s string) string {
	s = strings.TrimSpace(s)
	if s == "" {
		return ""
	}
	// Reject anything that looks like an absolute URL — keep image refs local.
	if strings.Contains(s, "://") {
		return ""
	}
	return path.Base(path.Clean("/" + s))
}

type CampaignService struct {
	campaignRepo *repository.CampaignRepo
	categoryRepo *repository.CategoryRepo
}

func NewCampaignService(campaignRepo *repository.CampaignRepo, categoryRepo *repository.CategoryRepo) *CampaignService {
	return &CampaignService{
		campaignRepo: campaignRepo,
		categoryRepo: categoryRepo,
	}
}

func (s *CampaignService) Create(req *request.CreateCampaignRequest, userID uuid.UUID) (*model.Campaign, error) {
	campaignSlug := slug.GenerateUnique(req.Title, s.campaignRepo.SlugExists)

	now := time.Now()
	c := model.Campaign{
		UserID:           userID,
		Title:            req.Title,
		Slug:             campaignSlug,
		ShortDescription: req.ShortDescription,
		Description:      req.Description,
		Unlimited:        req.Unlimited,
		Featured:         req.Featured,
		LocationName:     req.LocationName,
		LocationGmaps:    req.LocationGmaps,
		FormType:         req.FormType,
		Status:           req.Status, // respect Draft/Published from the form; defaulted below
		PostedAt:         &now,
		Icon:             req.Icon,
		Image:            sanitizeImageRef(req.Image),
		ThumbGradient:    req.ThumbGradient,
		FormStyle:        req.FormStyle,
		WANotification:   req.WANotification,
		FollowupEnabled:  req.FollowupEnabled,
		MetaPixelID:      req.MetaPixelID,
		TikTokPixelID:    req.TikTokPixelID,
		GTMID:            req.GTMID,
		PopupInfo:        req.PopupInfo,
		WAFlyingButton:   req.WAFlyingButton,
		ExternalLink:     req.ExternalLink,
		MinDonation:      req.MinDonation,
		MaxDonation:      req.MaxDonation,
		OptNominal:       req.OptNominal,
		ButtonColor:      req.ButtonColor,
		FormFieldsConfig: req.FormFieldsConfig,
	}

	if req.Target != nil {
		c.Target = *req.Target
	}
	if req.DurationDays != nil {
		c.DurationDays = *req.DurationDays
	}
	if req.CategoryID != nil {
		c.CategoryID = req.CategoryID
	}
	// Status was set from req.Status above; default only when the form sent none.
	if c.Status == "" {
		c.Status = "Berjalan"
	}
	if c.FormType == "" {
		c.FormType = "donasi"
	}

	if err := s.campaignRepo.Create(&c); err != nil {
		return nil, err
	}
	return &c, nil
}

func (s *CampaignService) Update(id uuid.UUID, req *request.UpdateCampaignRequest) (*model.Campaign, error) {
	c, err := s.campaignRepo.FindByID(id)
	if err != nil {
		return nil, errors.New("campaign not found")
	}

	campaignID := c.ID
	uniqueExceptSelf := func(candidate string) bool {
		found, findErr := s.campaignRepo.FindBySlug(candidate)
		if findErr != nil {
			return false
		}
		return found.ID != campaignID
	}

	// A user-edited slug wins; otherwise re-derive from the (possibly new) title.
	if req.Slug != "" {
		c.Slug = slug.GenerateUnique(req.Slug, uniqueExceptSelf)
		if req.Title != "" {
			c.Title = req.Title
		}
	} else if req.Title != "" {
		c.Title = req.Title
		c.Slug = slug.GenerateUnique(req.Title, uniqueExceptSelf)
	}
	if req.ShortDescription != "" {
		c.ShortDescription = req.ShortDescription
	}
	if req.Description != "" {
		c.Description = req.Description
	}
	if req.Target != nil {
		c.Target = *req.Target
	}
	if req.DurationDays != nil {
		c.DurationDays = *req.DurationDays
	}
	if req.CategoryID != nil {
		c.CategoryID = req.CategoryID
	}
	if req.Status != "" {
		c.Status = req.Status
	}
	if req.LocationName != "" {
		c.LocationName = req.LocationName
	}
	if req.LocationGmaps != "" {
		c.LocationGmaps = req.LocationGmaps
	}
	if req.FormType != "" {
		c.FormType = req.FormType
	}
	if req.Icon != "" {
		c.Icon = req.Icon
	}
	if req.Image != "" {
		c.Image = sanitizeImageRef(req.Image)
	}
	if req.ThumbGradient != "" {
		c.ThumbGradient = req.ThumbGradient
	}
	if req.FormStyle != "" {
		c.FormStyle = req.FormStyle
	}
	if req.MetaPixelID != "" {
		c.MetaPixelID = req.MetaPixelID
	}
	if req.TikTokPixelID != "" {
		c.TikTokPixelID = req.TikTokPixelID
	}
	if req.GTMID != "" {
		c.GTMID = req.GTMID
	}
	if req.ExternalLink != "" {
		c.ExternalLink = req.ExternalLink
	}
	if req.OptNominal != "" {
		c.OptNominal = req.OptNominal
	}
	if req.ButtonColor != "" {
		c.ButtonColor = req.ButtonColor
	}
	if req.FormFieldsConfig != "" {
		c.FormFieldsConfig = req.FormFieldsConfig
	}
	if req.WANotification != nil {
		c.WANotification = *req.WANotification
	}
	if req.FollowupEnabled != nil {
		c.FollowupEnabled = *req.FollowupEnabled
	}
	if req.PopupInfo != nil {
		c.PopupInfo = *req.PopupInfo
	}
	if req.WAFlyingButton != nil {
		c.WAFlyingButton = *req.WAFlyingButton
	}
	if req.MinDonation != nil {
		c.MinDonation = *req.MinDonation
	}
	if req.MaxDonation != nil {
		c.MaxDonation = *req.MaxDonation
	}
	c.Unlimited = req.Unlimited
	c.Featured = req.Featured

	if err := s.campaignRepo.Update(c); err != nil {
		return nil, err
	}
	return c, nil
}

func (s *CampaignService) Delete(id uuid.UUID) error {
	_, err := s.campaignRepo.FindByID(id)
	if err != nil {
		return errors.New("campaign not found")
	}
	return s.campaignRepo.Delete(id)
}
