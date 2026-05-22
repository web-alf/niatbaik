package request

type CreateUserRequest struct {
	Name     string `json:"name" validate:"required,min=2"`
	Email    string `json:"email" validate:"required,email"`
	Phone    string `json:"phone"`
	Password string `json:"password" validate:"required,min=8"`
	Role     string `json:"role" validate:"required,oneof=admin cs advertiser user fundraiser"`
}

type UpdateUserRequest struct {
	Name               string `json:"name"`
	Email              string `json:"email"`
	Phone              string `json:"phone"`
	Role               string `json:"role"`
	VerificationStatus string `json:"verification_status"`
}
