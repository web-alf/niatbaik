package database

import (
	"log"
	"time"

	"github.com/anrdart/niatbaik-api/internal/model"
	"github.com/gosimple/slug"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

func Seed(db *gorm.DB) error {
	if err := seedAdmin(db); err != nil {
		return err
	}
	if err := seedSettings(db); err != nil {
		return err
	}
	if err := seedCategories(db); err != nil {
		return err
	}
	if err := seedPaymentMethods(db); err != nil {
		return err
	}
	return nil
}

func seedAdmin(db *gorm.DB) error {
	var count int64
	db.Model(&model.User{}).Where("role = ?", "admin").Count(&count)
	if count > 0 {
		log.Println("[seed] admin user already exists, skipping")
		return nil
	}

	hash, err := bcrypt.GenerateFromPassword([]byte("admin123"), bcrypt.DefaultCost)
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

func seedCategories(db *gorm.DB) error {
	var count int64
	db.Model(&model.Category{}).Count(&count)
	if count > 0 {
		log.Println("[seed] categories already exist, skipping")
		return nil
	}

	names := []string{"Beasiswa", "Sekolah", "Yatim", "Tahfidz", "Mahasiswa", "Guru", "Literasi"}
	for _, name := range names {
		cat := model.Category{
			Name: name,
			Slug: slug.Make(name),
		}
		if err := db.Create(&cat).Error; err != nil {
			return err
		}
	}
	log.Printf("[seed] %d categories created\n", len(names))
	return nil
}

func seedPaymentMethods(db *gorm.DB) error {
	var count int64
	db.Model(&model.PaymentMethod{}).Count(&count)
	if count > 0 {
		log.Println("[seed] payment methods already exist, skipping")
		return nil
	}

	methods := []model.PaymentMethod{
		{BankName: "BCA Virtual Account", BankType: "BCA", Type: "va", Code: "bca", Category: "bank_transfer", Active: true},
		{BankName: "BNI Virtual Account", BankType: "BNI", Type: "va", Code: "bni", Category: "bank_transfer", Active: true},
		{BankName: "Mandiri Virtual Account", BankType: "Mandiri", Type: "va", Code: "mandiri", Category: "bank_transfer", Active: true},
		{BankName: "BSI Virtual Account", BankType: "BSI", Type: "va", Code: "bsi", Category: "bank_transfer", Active: true},
		{BankName: "QRIS", BankType: "QRIS", Type: "qris", Code: "qris", Category: "qris", Active: true},
		{BankName: "GoPay", BankType: "GoPay", Type: "ewallet", Code: "gopay", Category: "ewallet", Active: true},
		{BankName: "OVO", BankType: "OVO", Type: "ewallet", Code: "ovo", Category: "ewallet", Active: true},
		{BankName: "DANA", BankType: "DANA", Type: "ewallet", Code: "dana", Category: "ewallet", Active: true},
		{BankName: "ShopeePay", BankType: "ShopeePay", Type: "ewallet", Code: "shopeepay", Category: "ewallet", Active: true},
	}

	for i := range methods {
		if err := db.Create(&methods[i]).Error; err != nil {
			return err
		}
	}
	log.Printf("[seed] %d payment methods created\n", len(methods))
	return nil
}
