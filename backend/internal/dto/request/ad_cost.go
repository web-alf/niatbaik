package request

type CreateAdCostRequest struct {
	Platform string `json:"platform" validate:"required,oneof=meta google tiktok"`
	Amount   int64  `json:"amount" validate:"required,gt=0"`
	Date     string `json:"date" validate:"required"`
}
