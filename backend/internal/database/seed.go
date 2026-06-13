package database

import (
	"log"
	"os"
	"time"

	"github.com/anrdart/niatbaik-api/internal/model"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

func isProduction() bool {
	return os.Getenv("APP_ENV") == "production"
}

func Seed(db *gorm.DB) error {
	if err := seedAdmin(db); err != nil {
		return err
	}
	// Demo CS/advertiser accounts use publicly-known passwords and are for local
	// demos only. NEVER recreate them in production (they were a standing backdoor).
	if !isProduction() {
		if err := seedDemoStaff(db); err != nil {
			return err
		}
	} else {
		log.Println("[seed] production env — skipping demo staff accounts")
	}
	if err := seedSettings(db); err != nil {
		return err
	}
	// Sample categories and payment methods are intentionally NOT seeded — the admin
	// creates real categories and payment methods from Settings. Only the functional
	// essentials (admin/staff users, base settings, invoice statuses) are seeded.
	if err := seedPaymentStatuses(db); err != nil {
		return err
	}
	return nil
}

func seedPaymentStatuses(db *gorm.DB) error {
	var count int64
	db.Model(&model.PaymentStatus{}).Count(&count)
	if count > 0 {
		return nil
	}
	statuses := []model.PaymentStatus{
		{Code: "Menunggu Pembayaran", Label: "Menunggu Pembayaran", Color: "#F59E0B", IsPaid: false, IsDefault: true, SortOrder: 1},
		{Code: "Terbayar", Label: "Terbayar", Color: "#10B981", IsPaid: true, SortOrder: 2},
		{Code: "Sukses", Label: "Sukses", Color: "#10B981", IsPaid: true, SortOrder: 3},
		{Code: "Gagal", Label: "Gagal", Color: "#EF4444", IsPaid: false, SortOrder: 4},
		{Code: "Kadaluarsa", Label: "Kadaluarsa", Color: "#94A3B8", IsPaid: false, SortOrder: 5},
	}
	for i := range statuses {
		if err := db.Create(&statuses[i]).Error; err != nil {
			return err
		}
	}
	log.Printf("[seed] %d payment statuses created\n", len(statuses))
	return nil
}

func seedAdmin(db *gorm.DB) error {
	var count int64
	db.Model(&model.User{}).Where("role = ?", "admin").Count(&count)
	if count > 0 {
		log.Println("[seed] admin user already exists, skipping")
		return nil
	}

	// In production the initial admin password must come from the environment.
	// Falling back to the well-known "admin123" on a public deploy would be a
	// guaranteed account takeover, so refuse to seed instead.
	adminPassword := os.Getenv("SEED_ADMIN_PASSWORD")
	if adminPassword == "" {
		if isProduction() {
			log.Println("[seed] WARNING: no admin exists and SEED_ADMIN_PASSWORD is unset in production — skipping admin seed. Set SEED_ADMIN_PASSWORD and restart to create the initial admin.")
			return nil
		}
		adminPassword = "admin123" // dev convenience only
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(adminPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	now := time.Now()
	admin := model.User{
		Name:               "Administrator",
		Email:              "admin@niatbaik.org",
		Password:           string(hash),
		Role:               "admin",
		VerificationStatus: "verified",
		EmailVerifiedAt:    &now,
	}

	if err := db.Create(&admin).Error; err != nil {
		return err
	}
	log.Println("[seed] admin user created: admin@niatbaik.org")
	return nil
}

// seedDemoStaff creates CS + Advertiser demo accounts so the login screen's
// role-pill quick-login works against real auth. Passwords match the frontend
// LOGIN_ACCOUNTS map (login.jsx): cs123456 / advertiser123.
func seedDemoStaff(db *gorm.DB) error {
	now := time.Now()
	staff := []struct {
		Name, Email, Password, Role string
	}{
		{"Putri Maharani", "cs@niatbaik.org", "cs123456", "cs"},
		{"Dewi Lestari", "advertiser@niatbaik.org", "advertiser123", "advertiser"},
	}
	for _, s := range staff {
		var existing model.User
		err := db.Where("email = ?", s.Email).First(&existing).Error
		if err == nil {
			pwOK := bcrypt.CompareHashAndPassword([]byte(existing.Password), []byte(s.Password)) == nil
			roleOK := existing.Role == s.Role
			if pwOK && roleOK {
				continue
			}
			updates := map[string]interface{}{"role": s.Role}
			if !pwOK {
				newHash, _ := bcrypt.GenerateFromPassword([]byte(s.Password), bcrypt.DefaultCost)
				updates["password"] = string(newHash)
			}
			db.Model(&existing).Updates(updates)
			log.Printf("[seed] demo %s user synced: %s\n", s.Role, s.Email)
			continue
		}
		hash, err := bcrypt.GenerateFromPassword([]byte(s.Password), bcrypt.DefaultCost)
		if err != nil {
			return err
		}
		u := model.User{
			Name:               s.Name,
			Email:              s.Email,
			Password:           string(hash),
			Role:               s.Role,
			VerificationStatus: "verified",
			EmailVerifiedAt:    &now,
		}
		if err := db.Create(&u).Error; err != nil {
			return err
		}
		log.Printf("[seed] demo %s user created: %s\n", s.Role, s.Email)
	}
	return nil
}

func seedSettings(db *gorm.DB) error {
	var count int64
	db.Model(&model.Setting{}).Count(&count)
	if count > 0 {
		log.Println("[seed] settings already exists, skipping")
		return nil
	}

	settings := model.Setting{
		SiteName:       "NIATBAIK.ORG",
		PrimaryColor:   "#10B981",
		SecondaryColor: "#059669",
		Email:          "info@niatbaik.org",
		AutoSlide:      5,
		AdminFee:       0,
		FundraiserCommissionPercent: 5,
		ThemeColor:      "#10B981",
		ProgressbarColor: "#10B981",
		ButtonColor:     "#10B981",
		PoweredBy:       true,
		SMTPPort:        587,
	}

	if err := db.Create(&settings).Error; err != nil {
		return err
	}
	log.Println("[seed] default settings created")
	return nil
}

