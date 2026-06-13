package response

import (
	"fmt"

	"github.com/anrdart/niatbaik-api/pkg/pagination"
	"github.com/labstack/echo/v4"
)

type APIResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
	Meta    interface{} `json:"meta,omitempty"`
}

func SuccessResponse(data interface{}, message string) APIResponse {
	return APIResponse{
		Success: true,
		Message: message,
		Data:    data,
	}
}

func ErrorResponse(message string) APIResponse {
	return APIResponse{
		Success: false,
		Message: message,
	}
}

// ValidationMessage extracts a clean, user-facing message from a validation error.
// c.Validate returns an *echo.HTTPError whose .Error() is "code=422, message=...";
// surfacing that raw to the client leaks the framing. This unwraps it to just the
// message (the Indonesian text built by pkg/validator).
func ValidationMessage(err error) string {
	if he, ok := err.(*echo.HTTPError); ok {
		if msg, ok := he.Message.(string); ok {
			return msg
		}
		return fmt.Sprintf("%v", he.Message)
	}
	return err.Error()
}

func PaginatedResponse(data interface{}, p pagination.Pagination) APIResponse {
	return APIResponse{
		Success: true,
		Message: "success",
		Data:    data,
		Meta:    p,
	}
}
