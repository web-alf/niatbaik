package response

import (
	"time"

	"github.com/google/uuid"
)

type TokenResponse struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	TokenType    string `json:"token_type"`
	ExpiresIn    int64  `json:"expires_in"`
}

type UserResponse struct {
	ID                 uuid.UUID `json:"id"`
	Name               string    `json:"name"`
	Email              string    `json:"email"`
	Phone              string    `json:"phone"`
	Role               string    `json:"role"`
	Image              string    `json:"image"`
	VerificationStatus string    `json:"verification_status"`
	CreatedAt          time.Time `json:"created_at"`
}
