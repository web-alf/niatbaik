package request

type UpdateInvoiceStatusRequest struct {
	Status string `json:"status" validate:"required,oneof=Sukses Pending Gagal Terbayar"`
}

type AddInvoiceNoteRequest struct {
	Note string `json:"note" validate:"required"`
}
