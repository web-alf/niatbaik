package request

type UpdateInvoiceStatusRequest struct {
	// Validated dynamically against the admin-managed PaymentStatus list (not a fixed
	// oneof), so new statuses can be added without a code change.
	Status string `json:"status" validate:"required,max=50"`
}

type AddInvoiceNoteRequest struct {
	// Not required: an empty note is a valid "clear the note" action. Cap length only.
	Note string `json:"note" validate:"max=2000"`
}

type UpdateInvoiceQualityRequest struct {
	// Manual lead-quality tag. Empty clears the tag; otherwise one of the two labels.
	Quality string `json:"quality" validate:"omitempty,oneof=berkualitas invalid"`
}
