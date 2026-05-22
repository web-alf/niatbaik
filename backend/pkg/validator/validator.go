package validator

import (
	"fmt"
	"strings"

	"github.com/go-playground/validator/v10"
	"github.com/labstack/echo/v4"
)

// CustomValidator wraps go-playground/validator for Echo.
type CustomValidator struct {
	validator *validator.Validate
}

// New creates a CustomValidator instance.
func New() *CustomValidator {
	return &CustomValidator{validator: validator.New()}
}

// Validate satisfies echo.Validator interface.
func (cv *CustomValidator) Validate(i interface{}) error {
	if err := cv.validator.Struct(i); err != nil {
		errs := err.(validator.ValidationErrors)
		messages := make([]string, 0, len(errs))
		for _, e := range errs {
			messages = append(messages, formatError(e))
		}
		return echo.NewHTTPError(422, strings.Join(messages, "; "))
	}
	return nil
}

func formatError(e validator.FieldError) string {
	switch e.Tag() {
	case "required":
		return fmt.Sprintf("%s is required", e.Field())
	case "email":
		return fmt.Sprintf("%s must be a valid email", e.Field())
	case "min":
		return fmt.Sprintf("%s must be at least %s characters", e.Field(), e.Param())
	default:
		return fmt.Sprintf("%s failed on %s validation", e.Field(), e.Tag())
	}
}
