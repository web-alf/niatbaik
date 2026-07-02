package request

type UpdateProfileRequest struct {
	Name    string `json:"name"`
	Phone   string `json:"phone"`
	Address string `json:"address"`
	Bio     string `json:"bio"`
	// Image is the uploaded avatar path (/uploads/<uuid>.ext) returned by /uploads/image.
	// Pointer so an omitted field leaves the avatar unchanged while an explicit "" clears
	// it — a plain string can't tell "not sent" from "cleared".
	Image *string `json:"image"`
}
