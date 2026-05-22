package request

type LoginRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,min=6"`
}

type RegisterRequest struct {
	Name            string `json:"name" validate:"required,min=2"`
	Email           string `json:"email" validate:"required,email"`
	Phone           string `json:"phone" validate:"required"`
	Password        string `json:"password" validate:"required,min=8"`
	PasswordConfirm string `json:"password_confirm" validate:"required"`
}

type ForgotPasswordRequest struct {
	Email string `json:"email" validate:"required,email"`
}

type ResetPasswordRequest struct {
	Token           string `json:"token" validate:"required"`
	Email           string `json:"email" validate:"required,email"`
	Password        string `json:"password" validate:"required,min=8"`
	PasswordConfirm string `json:"password_confirm" validate:"required"`
}

type ChangePasswordRequest struct {
	CurrentPassword string `json:"current_password" validate:"required"`
	NewPassword     string `json:"new_password" validate:"required,min=8"`
	PasswordConfirm string `json:"password_confirm" validate:"required"`
}
