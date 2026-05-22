package response

import "github.com/anrdart/niatbaik-api/pkg/pagination"

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

func PaginatedResponse(data interface{}, p pagination.Pagination) APIResponse {
	return APIResponse{
		Success: true,
		Message: "success",
		Data:    data,
		Meta:    p,
	}
}
