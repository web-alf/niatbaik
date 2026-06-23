package router

import (
	"github.com/labstack/echo/v4"
	"gorm.io/gorm"

	"github.com/anrdart/niatbaik-api/internal/config"
	"github.com/anrdart/niatbaik-api/internal/handler"
	"github.com/anrdart/niatbaik-api/internal/middleware"
	"github.com/anrdart/niatbaik-api/internal/repository"
	"github.com/anrdart/niatbaik-api/internal/service"
	"github.com/anrdart/niatbaik-api/pkg/realtime"
)

func Setup(e *echo.Echo, db *gorm.DB, cfg *config.Config) {
	// Initialize repositories
	userRepo := repository.NewUserRepo(db)
	campaignRepo := repository.NewCampaignRepo(db)
	categoryRepo := repository.NewCategoryRepo(db)
	invoiceRepo := repository.NewInvoiceRepo(db)
	donationRepo := repository.NewDonationRepo(db)
	settingRepo := repository.NewSettingRepo(db)
	statsRepo := repository.NewStatsRepo(db)
	withdrawalRepo := repository.NewWithdrawalRepo(db)
	verificationRepo := repository.NewVerificationRepo(db)
	trashRepo := repository.NewTrashRepo(db)
	notificationRepo := repository.NewNotificationRepo(db)
	activityRepo := repository.NewActivityRepo(db)
	fundraiserRepo := repository.NewFundraiserRepo(db)
	commissionRepo := repository.NewCommissionRepo(db)
	adCostRepo := repository.NewAdCostRepo(db)
	paymentMethodRepo := repository.NewPaymentMethodRepo(db)
	dataStudioRepo := repository.NewDataStudioRepo(db)
	revokedTokenRepo := repository.NewRevokedTokenRepo(db)
	paymentStatusRepo := repository.NewPaymentStatusRepo(db)
	processedWebhookRepo := repository.NewProcessedWebhookRepo(db)
	trackingRepo := repository.NewTrackingRepo(db)
	trackingService := service.NewTrackingService(trackingRepo, settingRepo, cfg)

	// Initialize services
	authService := service.NewAuthService(db, cfg, revokedTokenRepo)
	paymentService := service.NewPaymentService(db, invoiceRepo, campaignRepo, settingRepo, fundraiserRepo, commissionRepo, trackingService)
	mootaService := service.NewMootaService(cfg, paymentService, invoiceRepo, settingRepo, processedWebhookRepo)
	flipService := service.NewFlipService(cfg, paymentService, invoiceRepo, settingRepo, processedWebhookRepo)
	donationService := service.NewDonationService(db, cfg, invoiceRepo, campaignRepo, donationRepo, settingRepo, paymentMethodRepo, flipService, paymentService)
	dashboardService := service.NewDashboardService(statsRepo)
	campaignService := service.NewCampaignService(campaignRepo, categoryRepo)
	userService := service.NewUserService(userRepo, settingRepo)
	analyticsService := service.NewAnalyticsService(statsRepo)
	withdrawalService := service.NewWithdrawalService(db, withdrawalRepo)
	verificationService := service.NewVerificationService(verificationRepo, userRepo)
	settingService := service.NewSettingService(settingRepo)
	trashService := service.NewTrashService(trashRepo)
	notificationService := service.NewNotificationService(notificationRepo)
	profileService := service.NewProfileService(db, activityRepo)
	uploadService := service.NewUploadService(cfg.UploadDir, cfg.MaxUploadSize)
	adCostService := service.NewAdCostService(adCostRepo)
	paymentMethodService := service.NewPaymentMethodService(paymentMethodRepo)
	dataStudioService := service.NewDataStudioService(dataStudioRepo)

	// Initialize handlers
	authHandler := handler.NewAuthHandler(authService)
	publicHandler := handler.NewPublicHandler(campaignRepo, categoryRepo, settingRepo, invoiceRepo, donationRepo, paymentMethodRepo, cfg)
	donationHandler := handler.NewDonationHandler(donationService)
	webhookHandler := handler.NewWebhookHandler(mootaService, flipService)
	dashboardHandler := handler.NewDashboardHandler(dashboardService)
	adminCampaignHandler := handler.NewAdminCampaignHandler(campaignService, campaignRepo)
	userHandler := handler.NewUserHandler(userService, userRepo)
	analyticsHandler := handler.NewAnalyticsHandler(analyticsService)
	settingHandler := handler.NewSettingHandler(settingService, mootaService)
	withdrawalHandler := handler.NewWithdrawalHandler(withdrawalService, withdrawalRepo)
	verificationHandler := handler.NewVerificationHandler(verificationService, verificationRepo)
	trashHandler := handler.NewTrashHandler(trashService)
	invoiceHandler := handler.NewInvoiceHandler(db, paymentService, paymentStatusRepo)
	fundraiserHandler := handler.NewFundraiserHandler(fundraiserRepo, commissionRepo)
	profileHandler := handler.NewProfileHandler(profileService)
	notificationHandler := handler.NewNotificationHandler(notificationService)
	uploadHandler := handler.NewUploadHandler(uploadService)
	adCostHandler := handler.NewAdCostHandler(adCostService)
	paymentMethodHandler := handler.NewPaymentMethodHandler(paymentMethodService)
	paymentStatusHandler := handler.NewPaymentStatusHandler(paymentStatusRepo)
	dataStudioHandler := handler.NewDataStudioHandler(dataStudioService)

	// Realtime change notifier: a global revision is bumped after every successful
	// mutating request (RevisionBumper), and long-poll clients block on /events until
	// it advances. Drives near-instant dashboard auto-refresh without WebSockets.
	notifier := realtime.New()
	eventsHandler := handler.NewEventsHandler(notifier)

	// API group
	api := e.Group("/api")
	api.Use(middleware.RevisionBumper(notifier))

	// Health
	api.GET("/health", publicHandler.HealthCheck)

	// Public routes (no auth)
	api.GET("/campaigns", publicHandler.ListCampaigns)
	api.GET("/campaigns/:slug", publicHandler.GetCampaign)
	api.GET("/categories", publicHandler.ListCategories)
	api.GET("/settings/public", publicHandler.GetPublicSettings)
	api.GET("/payment-methods/public", publicHandler.ListPaymentMethods)
	api.GET("/payment-statuses", paymentStatusHandler.List)
	api.GET("/stats", publicHandler.GetPublicStats)
	api.POST("/donations", donationHandler.CreateDonation)
	api.GET("/donations/:invoice", donationHandler.GetPaymentStatus)

	// Sandbox-only: simulate a successful payment so testers can advance QRIS / VA /
	// manual invoices to a paid state (Flip has a hosted link; the others don't). Mounted
	// ONLY in non-production — never expose a way to mark donations paid without real money.
	if !cfg.IsProduction() {
		api.POST("/donations/:invoice/simulate-payment", donationHandler.SimulatePayment)
	}

	// Webhooks (no auth, no CSRF)
	api.POST("/webhooks/moota", webhookHandler.HandleMoota)
	api.POST("/webhooks/flip", webhookHandler.HandleFlip)

	// Auth routes. Credential-guessing surfaces (login/forgot/reset) get a tight
	// per-IP rate limit to blunt brute-force and reset-spam; register is also
	// limited to curb mass signups.
	authLimiter := middleware.AuthRateLimiter()
	auth := api.Group("/auth")
	auth.POST("/login", authHandler.Login, authLimiter)
	auth.POST("/register", authHandler.Register, authLimiter)
	auth.POST("/refresh", authHandler.RefreshToken, authLimiter)
	auth.POST("/forgot-password", authHandler.ForgotPassword, authLimiter)
	auth.POST("/reset-password", authHandler.ResetPassword, authLimiter)

	// Protected routes (require JWT)
	protected := api.Group("")
	protected.Use(middleware.JWTMiddleware(cfg.JWTSecret, revokedTokenRepo))

	// Realtime long-poll (any authenticated dashboard user).
	protected.GET("/events", eventsHandler.Poll)

	// Auth (protected)
	protected.POST("/auth/logout", authHandler.Logout)
	protected.GET("/auth/me", authHandler.Me)

	// Profile (any authenticated user)
	protected.GET("/profile", profileHandler.GetProfile)
	protected.PUT("/profile", profileHandler.UpdateProfile)
	protected.PUT("/profile/password", profileHandler.ChangePassword)
	protected.GET("/profile/activity", profileHandler.GetActivityLog)
	protected.GET("/profile/logins", profileHandler.GetLoginHistory)

	// Notifications (any authenticated user)
	protected.GET("/notifications", notificationHandler.List)
	protected.PUT("/notifications/read", notificationHandler.MarkAllRead)
	protected.PUT("/notifications/:id/read", notificationHandler.MarkRead)

	// Uploads (any authenticated user)
	protected.POST("/uploads/image", uploadHandler.UploadImage)

	// Withdrawal request (campaign owner / fundraiser)
	protected.POST("/withdrawals", withdrawalHandler.CreateRequest)

	// Dashboard (admin + cs + advertiser) — staff only, not regular donors/fundraisers
	dashboard := protected.Group("/dashboard")
	dashboard.Use(middleware.RequireRole("admin", "cs", "advertiser"))
	dashboard.GET("/stats", dashboardHandler.GetStats)
	dashboard.GET("/chart/daily", dashboardHandler.GetDailyChart)
	dashboard.GET("/chart/payment-methods", dashboardHandler.GetPaymentMethodChart)
	dashboard.GET("/chart/traffic-sources", dashboardHandler.GetTrafficSourceChart)
	dashboard.GET("/recent-transactions", dashboardHandler.GetRecentTransactions)

	// Admin routes
	admin := protected.Group("")
	admin.Use(middleware.RequireAdmin())

	admin.GET("/admin/campaigns", adminCampaignHandler.List)
	admin.GET("/admin/campaigns/:id", adminCampaignHandler.Get)
	admin.POST("/admin/campaigns", adminCampaignHandler.Create)
	admin.PUT("/admin/campaigns/:id", adminCampaignHandler.Update)
	admin.DELETE("/admin/campaigns/:id", adminCampaignHandler.Delete)

	categoryHandler := handler.NewCategoryHandler(categoryRepo)
	admin.POST("/admin/categories", categoryHandler.Create)
	admin.PUT("/admin/categories/:id", categoryHandler.Update)
	admin.DELETE("/admin/categories/:id", categoryHandler.Delete)

	admin.GET("/users", userHandler.List)
	admin.POST("/users", userHandler.Create)
	admin.PUT("/users/:id", userHandler.Update)
	admin.DELETE("/users/:id", userHandler.Delete)

	admin.GET("/settings", settingHandler.Get)
	admin.PUT("/settings", settingHandler.Update)
	admin.POST("/settings/test-email", settingHandler.TestEmail)
	admin.GET("/settings/moota-balance", settingHandler.GetMootaBalance)

	admin.GET("/admin/payment-methods", paymentMethodHandler.List)
	admin.POST("/admin/payment-methods", paymentMethodHandler.Create)
	admin.PUT("/admin/payment-methods/:id", paymentMethodHandler.Update)
	admin.DELETE("/admin/payment-methods/:id", paymentMethodHandler.Delete)

	admin.POST("/admin/payment-statuses", paymentStatusHandler.Create)
	admin.PUT("/admin/payment-statuses/:id", paymentStatusHandler.Update)
	admin.DELETE("/admin/payment-statuses/:id", paymentStatusHandler.Delete)

	admin.GET("/withdrawals", withdrawalHandler.List)
	admin.POST("/withdrawals/:id/approve", withdrawalHandler.Approve)
	admin.POST("/withdrawals/:id/reject", withdrawalHandler.Reject)

	admin.GET("/verifications", verificationHandler.List)
	admin.POST("/verifications/:id/approve", verificationHandler.Approve)
	admin.POST("/verifications/:id/reject", verificationHandler.Reject)

	admin.GET("/trash", trashHandler.List)
	admin.POST("/trash/:type/:id/restore", trashHandler.Restore)
	admin.DELETE("/trash/:type/:id", trashHandler.PermanentDelete)

	admin.GET("/fundraisers", fundraiserHandler.List)
	admin.GET("/fundraisers/:id", fundraiserHandler.GetDetail)

	// CS routes (admin + cs)
	cs := protected.Group("")
	cs.Use(middleware.RequireCS())

	cs.GET("/invoices", invoiceHandler.List)
	cs.GET("/invoices/:id", invoiceHandler.GetDetail)
	cs.PUT("/invoices/:id/status", invoiceHandler.UpdateStatus)
	cs.PUT("/invoices/:id/note", invoiceHandler.AddNote)

	// Analytics (admin + advertiser)
	analytics := protected.Group("/analytics")
	analytics.Use(middleware.RequireAdvertiser())

	analytics.GET("/overview", analyticsHandler.GetOverview)
	analytics.GET("/campaigns", analyticsHandler.GetCampaignPerformance)
	analytics.GET("/utm", analyticsHandler.GetUTMTracking)
	analytics.GET("/traffic", analyticsHandler.GetTrafficBreakdown)
	analytics.GET("/funnel", analyticsHandler.GetFunnel)
	analytics.POST("/ad-costs", adCostHandler.Create)
	analytics.GET("/ad-costs", adCostHandler.List)

	// Data Studio (admin + advertiser)
	ds := protected.Group("/datastudio")
	ds.Use(middleware.RequireAdvertiser())
	ds.GET("/overview", dataStudioHandler.GetOverview)
	ds.GET("/funnel", dataStudioHandler.GetFunnel)
	ds.GET("/meta", dataStudioHandler.GetMeta)
	ds.GET("/google", dataStudioHandler.GetGoogle)
	ds.GET("/tiktok", dataStudioHandler.GetTiktok)
	ds.GET("/geo", dataStudioHandler.GetGeo)
}
