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
	campaignRepo      *repository.CampaignRepo
	categoryRepo      *repository.CategoryRepo
	settingRepo       *repository.SettingRepo
	invoiceRepo       *repository.InvoiceRepo
	donationRepo      *repository.DonationRepo
	paymentMethodRepo *repository.PaymentMethodRepo
}

func NewPublicHandler(
	campaignRepo *repository.CampaignRepo,
	categoryRepo *repository.CategoryRepo,
	settingRepo *repository.SettingRepo,
	invoiceRepo *repository.InvoiceRepo,
	donationRepo *repository.DonationRepo,
	paymentMethodRepo *repository.PaymentMethodRepo,
) *PublicHandler {
	return &PublicHandler{
		campaignRepo:      campaignRepo,
		categoryRepo:      categoryRepo,
		settingRepo:       settingRepo,
		invoiceRepo:       invoiceRepo,
		donationRepo:      donationRepo,
		paymentMethodRepo: paymentMethodRepo,
	}
}

func (h *PublicHandler) ListCampaigns(c echo.Context) error {
	params := request.ParsePaginationParams(c)
	// Only donatable (live) campaigns are public — a Draft/Pending/Selesai campaign must
	// never be listed, because donation_service would reject any donation to it with a
	// generic error ("lead ga bisa masuk"). FindAllLive filters status IN donatableStatuses.
	campaigns, total, err := h.campaignRepo.FindAllLive(params)
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
	// Accept either the slug (Long URL) or the UUID (Short URL /c/<id>).
	campaign, err := h.campaignRepo.FindBySlugOrID(slug)
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
		"site_name":           settings.SiteName,
		"logo":                settings.Logo,
		"primary_color":       settings.PrimaryColor,
		"secondary_color":     settings.SecondaryColor,
		"theme_color":         settings.ThemeColor,
		"button_color":        settings.ButtonColor,
		"progressbar_color":   settings.ProgressbarColor,
		"font_family":         settings.FontFamily,
		"border_radius":       settings.BorderRadius,
		"description":         settings.Description,
		// Form config
		"form_fields_config":  settings.FormFieldsConfig,
		"nominal_presets":     settings.NominalPresets,
		"min_donation_global": settings.MinDonationGlobal,
		"anonymous_default":   settings.AnonymousDefault,
		"message_enabled":     settings.MessageEnabled,
		"social_proof_enabled": settings.SocialProofEnabled,
		"social_proof_config":  settings.SocialProofConfig,
		// Tracking (public IDs, not secrets)
		"meta_pixel_id":          settings.MetaPixelID,
		"meta_capi_enabled":      settings.MetaCAPIEnabled,
		"gtm_id":                 settings.GTMID,
		"google_ads_conversion_id": settings.GoogleAdsConversionID,
		"ga4_measurement_id":     settings.GA4MeasurementID,
		"tiktok_pixel_id":        settings.TiktokPixelID,
		"event_tracking_config":  settings.EventTrackingConfig,
		// Contact + donor greeting / CS rotator
		"whatsapp_admin":  settings.WhatsappAdmin,
		"donor_greeting":  settings.DonorGreeting,
		"cs_contacts":     settings.CSContacts,
		"cs_rotator_mode": settings.CSRotatorMode,
		// Manual bank-transfer destination (shown on the confirmation page when Flip
		// is off). Public, non-secret — it's the org's donation account.
		"bank_name":         settings.BankName,
		"bank_number":       settings.BankNumber,
		"bank_account_name": settings.BankAccountName,
		"flip_enabled":      settings.FlipEnabled,
	}
	return c.JSON(http.StatusOK, response.SuccessResponse(publicSettings, "success"))
}

func (h *PublicHandler) ListPaymentMethods(c echo.Context) error {
	// Source of truth is the admin's Payment settings (Setting row), NOT the legacy
	// payment_methods table — that table has no admin CRUD UI and ships empty, so the
	// public form used to fall back to a hardcoded string list that never matched what
	// the admin configured. Derive the list from settings so donor-facing methods stay
	// in sync:
	//   - Flip enabled (automatic gateway) → the channels Flip settles (QRIS / VA /
	//     e-wallet). Routing is decided by settings.flip_enabled, not the chosen row,
	//     so these are display-only; the donor pays on Flip's hosted page.
	//   - Flip disabled → the single manual bank-transfer account the admin entered
	//     (bank_name / bank_number / bank_account_name), reconciled via Moota.
	// Any active rows an admin added directly to payment_methods are still surfaced
	// (merged in) so manual/API-managed methods keep working.
	settings, err := h.settingRepo.Get()
	if err != nil {
		return c.JSON(http.StatusInternalServerError, response.ErrorResponse("Failed to fetch payment settings"))
	}

	flipGateway := settings != nil && settings.FlipEnabled

	items := make([]map[string]interface{}, 0, 12)

	if flipGateway {
		// QRIS first (most common), then VA banks, then e-wallets — matches the grouping
		// the public form already renders. Stable string ids (not DB UUIDs): the backend
		// records payment_method by label anyway when the id isn't a real payment_method.
		channels := []struct {
			id, name, typ, category string
		}{
			{"flip-qris", "QRIS", "qris", "qris"},
			{"flip-va-bca", "BCA", "va", "bank_transfer"},
			{"flip-va-mandiri", "Mandiri", "va", "bank_transfer"},
			{"flip-va-bni", "BNI", "va", "bank_transfer"},
			{"flip-va-bri", "BRI", "va", "bank_transfer"},
			{"flip-ewallet-gopay", "GoPay", "ewallet", "ewallet"},
			{"flip-ewallet-ovo", "OVO", "ewallet", "ewallet"},
			{"flip-ewallet-dana", "Dana", "ewallet", "ewallet"},
			{"flip-ewallet-shopeepay", "ShopeePay", "ewallet", "ewallet"},
		}
		for _, ch := range channels {
			items = append(items, map[string]interface{}{
				"id":           ch.id,
				"bank_name":    ch.name,
				"bank_number":  "",
				"bank_type":    ch.typ,
				"account_name": "",
				"type":         ch.typ,
				"category":     ch.category,
				"code":         "",
				"admin_fee":    settings.AdminFee,
				"image":        "",
			})
		}
	} else if settings != nil && settings.BankName != "" {
		// Manual transfer to the org's account. This is what donors must actually pay to
		// when the gateway is off, so surface the real account the admin configured.
		items = append(items, map[string]interface{}{
			"id":           "manual-bank",
			"bank_name":    settings.BankName,
			"bank_number":  settings.BankNumber,
			"bank_type":    "va",
			"account_name": settings.BankAccountName,
			"type":         "va",
			"category":     "bank_transfer",
			"code":         "",
			"admin_fee":    settings.AdminFee,
			"image":        "",
		})
	}

	// Merge any admin-managed rows from the payment_methods table (manual/API additions),
	// de-duped by bank_name so a manually-added "BCA" doesn't double up with a Flip channel.
	seen := make(map[string]bool, len(items))
	for _, it := range items {
		if n, ok := it["bank_name"].(string); ok {
			seen[n] = true
		}
	}
	if rows, err := h.paymentMethodRepo.FindActive(); err == nil {
		for _, m := range rows {
			if seen[m.BankName] {
				continue
			}
			seen[m.BankName] = true
			items = append(items, map[string]interface{}{
				"id":           m.ID,
				"bank_name":    m.BankName,
				"bank_number":  m.BankNumber,
				"bank_type":    m.BankType,
				"account_name": m.AccountName,
				"type":         m.Type,
				"category":     m.Category,
				"code":         m.Code,
				"admin_fee":    m.AdminFee,
				"image":        m.Image,
			})
		}
	}

	return c.JSON(http.StatusOK, response.SuccessResponse(items, "success"))
}

func (h *PublicHandler) GetPublicStats(c echo.Context) error {
	settings, err := h.settingRepo.Get()
	if err != nil {
		return c.JSON(http.StatusInternalServerError, response.ErrorResponse("Failed to fetch settings"))
	}

	totalDonors, _ := h.invoiceRepo.CountAllPaidDonors()

	statusCounts, _ := h.campaignRepo.CountByStatus()
	activeCampaigns := statusCounts["Berjalan"] + statusCounts["Running"]

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
