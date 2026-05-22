package request

type UpdateProfileRequest struct {
	Name    string `json:"name"`
	Phone   string `json:"phone"`
	Address string `json:"address"`
	Bio     string `json:"bio"`
}
