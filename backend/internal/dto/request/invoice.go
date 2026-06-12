package request

type UpdateInvoiceStatusRequest struct {
	// Validated dynamically against the admin-managed PaymentStatus list (not a fixed
	// oneof), so new statuses can be added without a code change.
	Status string `json:"status" validate:"required,max=50"`
}

type AddInvoiceNoteRequest struct {
	Note string `json:"note" validate:"required"`
}
