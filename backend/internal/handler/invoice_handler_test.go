package handler

import (
	"testing"
	"time"

	"github.com/anrdart/niatbaik-api/internal/model"
)

func TestSpreadsheetSafe(t *testing.T) {
	tests := map[string]string{
		"": "", "normal": "normal", "=SUM(A1:A2)": "'=SUM(A1:A2)",
		"+cmd": "'+cmd", "-1+2": "'-1+2", "@IMPORTXML(x)": "'@IMPORTXML(x)",
	}
	for input, want := range tests {
		if got := spreadsheetSafe(input); got != want {
			t.Errorf("%q = %q, want %q", input, got, want)
		}
	}
}

func TestInvoiceCSVRecordIncludesGoogleAdsAudit(t *testing.T) {
	attempted := time.Date(2026, 7, 21, 10, 0, 0, 0, time.UTC)
	inv := model.Invoice{
		InvoiceNumber: "INV-1", DonorName: "=bad", Gclid: "gclid-1", GAClientID: "ga-1",
		GoogleAdsConversionStatus:      model.GoogleAdsConversionClientSent,
		GoogleAdsConversionAttemptedAt: &attempted,
		GoogleAdsConversionError:       "+bad",
	}
	got := invoiceCSVRecord(inv)
	if len(got) != len(invoiceCSVHeader) {
		t.Fatalf("columns = %d, want %d", len(got), len(invoiceCSVHeader))
	}
	if got[2] != "'=bad" || got[18] != "gclid-1" || got[19] != "ga-1" ||
		got[20] != model.GoogleAdsConversionClientSent || got[23] != "'+bad" {
		t.Fatalf("unexpected record: %#v", got)
	}
}
