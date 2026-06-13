package validator

import (
	"fmt"
	"reflect"
	"strings"

	"github.com/go-playground/validator/v10"
	"github.com/labstack/echo/v4"
)

// CustomValidator wraps go-playground/validator for Echo.
type CustomValidator struct {
	validator *validator.Validate
}

// New creates a CustomValidator instance. It registers a tag-name func so error
// messages reference the JSON field name (donor_phone) rather than the Go field
// name (DonorPhone), which is then mapped to a friendly Indonesian label.
func New() *CustomValidator {
	v := validator.New()
	v.RegisterTagNameFunc(func(fld reflect.StructField) string {
		name := strings.SplitN(fld.Tag.Get("json"), ",", 2)[0]
		if name == "-" || name == "" {
			return fld.Name
		}
		return name
	})
	return &CustomValidator{validator: v}
}

// Validate satisfies echo.Validator interface.
func (cv *CustomValidator) Validate(i interface{}) error {
	if err := cv.validator.Struct(i); err != nil {
		errs, ok := err.(validator.ValidationErrors)
		if !ok {
			return echo.NewHTTPError(422, err.Error())
		}
		messages := make([]string, 0, len(errs))
		for _, e := range errs {
			messages = append(messages, formatError(e))
		}
		return echo.NewHTTPError(422, strings.Join(messages, "; "))
	}
	return nil
}

// fieldLabels maps JSON field names to human-friendly Indonesian labels used in
// error messages. Unmapped fields fall back to the raw field name.
var fieldLabels = map[string]string{
	"donor_name":          "Nama",
	"donor_phone":         "No. WhatsApp",
	"donor_email":         "Email",
	"amount":              "Nominal donasi",
	"campaign_slug":       "Campaign",
	"payment_method":      "Metode pembayaran",
	"title":               "Judul",
	"short_description":   "Deskripsi singkat",
	"description":         "Deskripsi",
	"email":               "Email",
	"password":            "Password",
	"name":                "Nama",
	"status":              "Status",
	"type":                "Tipe",
	"bank_name":           "Nama bank",
	"min_donation_global": "Minimal donasi global",
}

func label(field string) string {
	if l, ok := fieldLabels[field]; ok {
		return l
	}
	return field
}

// formatError renders a single validation failure as a clear Indonesian sentence.
func formatError(e validator.FieldError) string {
	f := label(e.Field())
	switch e.Tag() {
	case "required":
		return fmt.Sprintf("%s wajib diisi", f)
	case "email":
		return fmt.Sprintf("%s harus berupa alamat email yang valid", f)
	case "min":
		if e.Kind() == reflect.String {
			return fmt.Sprintf("%s minimal %s karakter", f, e.Param())
		}
		return fmt.Sprintf("%s minimal %s", f, e.Param())
	case "max":
		if e.Kind() == reflect.String {
			return fmt.Sprintf("%s maksimal %s karakter", f, e.Param())
		}
		return fmt.Sprintf("%s maksimal %s", f, e.Param())
	case "numeric":
		return fmt.Sprintf("%s harus berupa angka", f)
	case "gt":
		return fmt.Sprintf("%s harus lebih dari %s", f, e.Param())
	case "gte":
		return fmt.Sprintf("%s minimal %s", f, e.Param())
	case "lt":
		return fmt.Sprintf("%s harus kurang dari %s", f, e.Param())
	case "lte":
		return fmt.Sprintf("%s maksimal %s", f, e.Param())
	case "oneof":
		return fmt.Sprintf("%s tidak valid", f)
	case "len":
		return fmt.Sprintf("%s harus %s karakter", f, e.Param())
	default:
		return fmt.Sprintf("%s tidak valid", f)
	}
}
