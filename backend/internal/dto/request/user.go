package request

type CreateUserRequest struct {
	Name     string `json:"name" validate:"required,min=2"`
	Email    string `json:"email" validate:"required,email"`
	Phone    string `json:"phone"`
	Username string `json:"username"` // optional; auto-generated from email when blank
	Password string `json:"password" validate:"required,min=8,max=72"` // bcrypt truncates >72 bytes
	Role     string `json:"role" validate:"required,oneof=admin cs advertiser user fundraiser"`
}

type UpdateUserRequest struct {
	Name  string `json:"name"`
	Email string `json:"email" validate:"omitempty,email"`
	Phone string `json:"phone" validate:"omitempty,min=7,max=20"`
	// Username: admin-set handle. Optional; empty leaves it unchanged. No cooldown for admin.
	Username string `json:"username"`
	Role  string `json:"role" validate:"omitempty,oneof=admin cs advertiser user fundraiser"`
	// Password: admin-set new password. Optional — empty means "leave unchanged".
	// Validated only when present. bcrypt truncates >72 bytes.
	Password string `json:"password" validate:"omitempty,min=8,max=72"`
}
