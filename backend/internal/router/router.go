package router

import (
	"github.com/labstack/echo/v4"
	"gorm.io/gorm"

	"github.com/anrdart/niatbaik-api/internal/config"
	"github.com/anrdart/niatbaik-api/internal/handler"
	"github.com/anrdart/niatbaik-api/internal/middleware"
	"github.com/anrdart/niatbaik-api/internal/repository"
	"github.com/anrdart/niatbaik-api/internal/service"
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

	// Initialize services
	authService := service.NewAuthService(db, cfg)
	paymentService := service.NewPaymentService(db, invoiceRepo, campaignRepo, settingRepo, fundraiserRepo, commissionRepo)
	mootaService := service.NewMootaService(cfg, paymentService, invoiceRepo, settingRepo)
	flipService := service.NewFlipService(cfg, paymentService, invoiceRepo, settingRepo)
	donationService := service.NewDonationService(db, cfg, invoiceRepo, campaignRepo, donationRepo, settingRepo, flipService)
	webhookService := service.NewWebhookService(paymentService, invoiceRepo)
	dashboardService := service.NewDashboardService(statsRepo)
	campaignService := service.NewCampaignService(campaignRepo, categoryRepo)
	userService := service.NewUserService(userRepo)
	analyticsService := service.NewAnalyticsService(statsRepo)
	withdrawalService := service.NewWithdrawalService(withdrawalRepo)
	verificationService := service.NewVerificationService(verificationRepo, userRepo)
	settingService := service.NewSettingService(settingRepo)
	trashService := service.NewTrashService(trashRepo)
	notificationService := service.NewNotificationService(notificationRepo)
	profileService := service.NewProfileService(db, activityRepo)
	uploadService := service.NewUploadService(cfg.UploadDir, cfg.MaxUploadSize)
	adCostService := service.NewAdCostService(adCostRepo)

	// Initialize handlers
	authHandler := handler.NewAuthHandler(authService)
	publicHandler := handler.NewPublicHandler(campaignRepo, categoryRepo, settingRepo, invoiceRepo, donationRepo)
	donationHandler := handler.NewDonationHandler(donationService)
	webhookHandler := handler.NewWebhookHandler(webhookService, mootaService, flipService)
	dashboardHandler := handler.NewDashboardHandler(dashboardService)
	adminCampaignHandler := handler.NewAdminCampaignHandler(campaignService, campaignRepo)
	userHandler := handler.NewUserHandler(userService, userRepo)
	analyticsHandler := handler.NewAnalyticsHandler(analyticsService)
	settingHandler := handler.NewSettingHandler(settingService)
	withdrawalHandler := handler.NewWithdrawalHandler(withdrawalService, withdrawalRepo)
	verificationHandler := handler.NewVerificationHandler(verificationService, verificationRepo)
	trashHandler := handler.NewTrashHandler(trashService)
	invoiceHandler := handler.NewInvoiceHandler(db, paymentService)
	fundraiserHandler := handler.NewFundraiserHandler(fundraiserRepo, commissionRepo)
	profileHandler := handler.NewProfileHandler(profileService)
	notificationHandler := handler.NewNotificationHandler(notificationService)
	uploadHandler := handler.NewUploadHandler(uploadService)
	adCostHandler := handler.NewAdCostHandler(adCostService)

	// API group
	api := e.Group("/api")

	// Health
	api.GET("/health", publicHandler.HealthCheck)

	// Public routes (no auth)
	api.GET("/campaigns", publicHandler.ListCampaigns)
	api.GET("/campaigns/:slug", publicHandler.GetCampaign)
	api.GET("/categories", publicHandler.ListCategories)
	api.GET("/settings/public", publicHandler.GetPublicSettings)
	api.GET("/stats", publicHandler.GetPublicStats)
	api.POST("/donations", donationHandler.CreateDonation)
	api.GET("/donations/:invoice", donationHandler.GetPaymentStatus)

	// Webhooks (no auth, no CSRF)
	api.POST("/webhooks/ipaymu", webhookHandler.HandleIpaymu)
	api.POST("/webhooks/cekmutasi", webhookHandler.HandleCekmutasi)
	api.POST("/webhooks/moota", webhookHandler.HandleMoota)
	api.POST("/webhooks/flip", webhookHandler.HandleFlip)

	// Auth routes
	auth := api.Group("/auth")
	auth.POST("/login", authHandler.Login)
	auth.POST("/register", authHandler.Register)
	auth.POST("/refresh", authHandler.RefreshToken)
	auth.POST("/forgot-password", authHandler.ForgotPassword)
	auth.POST("/reset-password", authHandler.ResetPassword)

	// Protected routes (require JWT)
	protected := api.Group("")
	protected.Use(middleware.JWTMiddleware(cfg.JWTSecret))

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

	// Dashboard (admin + cs + advertiser)
	dashboard := protected.Group("/dashboard")
	dashboard.GET("/stats", dashboardHandler.GetStats)
	dashboard.GET("/chart/daily", dashboardHandler.GetDailyChart)
	dashboard.GET("/chart/payment-methods", dashboardHandler.GetPaymentMethodChart)
	dashboard.GET("/chart/traffic-sources", dashboardHandler.GetTrafficSourceChart)
	dashboard.GET("/recent-transactions", dashboardHandler.GetRecentTransactions)

	// Admin routes
	admin := protected.Group("")
	admin.Use(middleware.RequireAdmin())

	admin.GET("/admin/campaigns", adminCampaignHandler.List)
	admin.POST("/admin/campaigns", adminCampaignHandler.Create)
	admin.PUT("/admin/campaigns/:id", adminCampaignHandler.Update)
	admin.DELETE("/admin/campaigns/:id", adminCampaignHandler.Delete)

	admin.GET("/users", userHandler.List)
	admin.POST("/users", userHandler.Create)
	admin.PUT("/users/:id", userHandler.Update)
	admin.DELETE("/users/:id", userHandler.Delete)

	admin.GET("/settings", settingHandler.Get)
	admin.PUT("/settings", settingHandler.Update)

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
}
