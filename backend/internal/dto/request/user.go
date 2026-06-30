package request

type CreateUserRequest struct {
	Name     string `json:"name" validate:"required,min=2"`
	Email    string `json:"email" validate:"required,email"`
	Phone    string `json:"phone"`
	Password string `json:"password" validate:"required,min=8,max=72"` // bcrypt truncates >72 bytes
	Role     string `json:"role" validate:"required,oneof=admin cs advertiser user fundraiser"`
	// Admin-set account status. Empty => "verified" (admin-created staff are trusted
	// and active immediately, no email round-trip required).
	VerificationStatus string `json:"verification_status" validate:"omitempty,oneof=unverified pending verified rejected"`
}

type UpdateUserRequest struct {
	Name               string `json:"name"`
	Email              string `json:"email" validate:"omitempty,email"`
	Phone              string `json:"phone" validate:"omitempty,min=7,max=20"`
	Role               string `json:"role" validate:"omitempty,oneof=admin cs advertiser user fundraiser"`
	VerificationStatus string `json:"verification_status" validate:"omitempty,oneof=unverified pending verified rejected"`
}
