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
	Username           string    `json:"username"`
	Role               string    `json:"role"`
	Image              string     `json:"image"`
	LastLoginAt        *time.Time `json:"last_login_at"`
	// UsernameChangedAt lets the client show/enforce the 30-day rename cooldown (admins are
	// exempt server-side; this is null until the first change).
	UsernameChangedAt  *time.Time `json:"username_changed_at"`
	CreatedAt          time.Time  `json:"created_at"`
	BonusBalance       int64      `json:"bonus_balance"`
	BonusWithdrawn     int64      `json:"bonus_withdrawn"`
}
