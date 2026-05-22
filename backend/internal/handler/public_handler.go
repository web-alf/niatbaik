package handler

import (
	"net/http"

	"github.com/anrdart/niatbaik-api/internal/dto/request"
	"github.com/anrdart/niatbaik-api/internal/dto/response"
	"github.com/anrdart/niatbaik-api/internal/repository"
	"github.com/anrdart/niatbaik-api/pkg/pagination"
	"github.com/labstack/echo/v4"
)

type PublicHandler struct {
	campaignRepo *repository.CampaignRepo
	categoryRepo *repository.CategoryRepo
	settingRepo  *repository.SettingRepo
	invoiceRepo  *repository.InvoiceRepo
	donationRepo *repository.DonationRepo
}

func NewPublicHandler(
	campaignRepo *repository.CampaignRepo,
	categoryRepo *repository.CategoryRepo,
	settingRepo *repository.SettingRepo,
	invoiceRepo *repository.InvoiceRepo,
	donationRepo *repository.DonationRepo,
) *PublicHandler {
	return &PublicHandler{
		campaignRepo: campaignRepo,
		categoryRepo: categoryRepo,
		settingRepo:  settingRepo,
		invoiceRepo:  invoiceRepo,
		donationRepo: donationRepo,
	}
}

func (h *PublicHandler) ListCampaigns(c echo.Context) error {
	params := request.ParsePaginationParams(c)
	campaigns, total, err := h.campaignRepo.FindAll(params)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, response.ErrorResponse("Failed to fetch campaigns"))
	}

	var items []response.CampaignListItem
	for i := range campaigns {
		donorCount, _ := h.invoiceRepo.CountDonors(campaigns[i].ID)
		items = append(items, response.ToCampaignListItem(&campaigns[i], donorCount))
	}

	p := pagination.Paginate(pagination.PaginationParams{
		Page:  params.Page,
		Limit: params.Limit,
		Sort:  params.Sort,
	}, total)

	return c.JSON(http.StatusOK, response.PaginatedResponse(items, p))
}

func (h *PublicHandler) GetCampaign(c echo.Context) error {
	slug := c.Param("slug")
	campaign, err := h.campaignRepo.FindBySlug(slug)
	if err != nil {
		return c.JSON(http.StatusNotFound, response.ErrorResponse("Campaign not found"))
	}

	donorCount, _ := h.invoiceRepo.CountDonors(campaign.ID)

	// Get recent donors from paid invoices
	donations, _ := h.donationRepo.FindByCampaign(campaign.ID, 20)
	var donors []response.CampaignDonor
	for _, d := range donations {
		name := d.DonorName
		isAnon := false
		if d.Invoice.IsAnonymous {
			name = "Anonim"
			isAnon = true
		}
		donors = append(donors, response.CampaignDonor{
			Name:        name,
			Amount:      d.Amount,
			IsAnonymous: isAnon,
			CreatedAt:   d.CreatedAt,
		})
	}

	// Map updates
	var updates []response.CampaignUpdateItem
	for _, u := range campaign.Updates {
		updates = append(updates, response.CampaignUpdateItem{
			Title:     u.Title,
			Body:      u.Body,
			Image:     u.Image,
			CreatedAt: u.CreatedAt,
		})
	}

	detail := response.ToCampaignDetail(campaign, donorCount, donors, updates)
	return c.JSON(http.StatusOK, response.SuccessResponse(detail, "success"))
}

func (h *PublicHandler) ListCategories(c echo.Context) error {
	categories, err := h.categoryRepo.FindAll()
	if err != nil {
		return c.JSON(http.StatusInternalServerError, response.ErrorResponse("Failed to fetch categories"))
	}
	return c.JSON(http.StatusOK, response.SuccessResponse(categories, "success"))
}

func (h *PublicHandler) GetPublicSettings(c echo.Context) error {
	settings, err := h.settingRepo.Get()
	if err != nil {
		return c.JSON(http.StatusInternalServerError, response.ErrorResponse("Failed to fetch settings"))
	}

	publicSettings := map[string]interface{}{
		"site_name":       settings.SiteName,
		"logo":            settings.Logo,
		"primary_color":   settings.PrimaryColor,
		"secondary_color": settings.SecondaryColor,
		"theme_color":     settings.ThemeColor,
		"description":     settings.Description,
	}
	return c.JSON(http.StatusOK, response.SuccessResponse(publicSettings, "success"))
}

func (h *PublicHandler) GetPublicStats(c echo.Context) error {
	settings, err := h.settingRepo.Get()
	if err != nil {
		return c.JSON(http.StatusInternalServerError, response.ErrorResponse("Failed to fetch settings"))
	}

	totalDonors, _ := h.invoiceRepo.CountAllPaidDonors()

	statusCounts, _ := h.campaignRepo.CountByStatus()
	activeCampaigns := statusCounts["Berjalan"]

	var totalCampaigns int64
	for _, count := range statusCounts {
		totalCampaigns += count
	}

	stats := map[string]interface{}{
		"total_raised":     settings.TotalMoney,
		"total_donors":     totalDonors,
		"active_campaigns": activeCampaigns,
		"total_campaigns":  totalCampaigns,
	}
	return c.JSON(http.StatusOK, response.SuccessResponse(stats, "success"))
}

func (h *PublicHandler) HealthCheck(c echo.Context) error {
	return c.JSON(http.StatusOK, map[string]string{"status": "ok"})
}
