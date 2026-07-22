package service

import (
	"context"
	"errors"
	"github.com/anrdart/niatbaik-api/internal/model"
	"github.com/anrdart/niatbaik-api/internal/repository"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"testing"
	"time"
)

type fakeDM struct {
	ingests, polls int
	request        string
	status         DataManagerRequestStatus
	err            error
}

func (f *fakeDM) Ingest(context.Context, GoogleAdsConversion, bool) (string, error) {
	f.ingests++
	return f.request, f.err
}
func (f *fakeDM) RetrieveStatus(context.Context, string) (DataManagerRequestStatus, error) {
	f.polls++
	return f.status, f.err
}

type fakeQueue struct {
	inv   *model.Invoice
	calls []string
}

func (f *fakeQueue) ClaimGoogleAdsDue(context.Context, time.Time) (*model.Invoice, error) {
	if f.inv == nil {
		return nil, gorm.ErrRecordNotFound
	}
	v := f.inv
	f.inv = nil
	return v, nil
}
func (f *fakeQueue) StartGoogleAdsSubmission(context.Context, uuid.UUID, time.Time) error {
	f.calls = append(f.calls, "start")
	return nil
}
func (f *fakeQueue) PersistGoogleAdsRequestID(context.Context, uuid.UUID, string, time.Time) error {
	f.calls = append(f.calls, "persist")
	return nil
}
func (f *fakeQueue) MarkGoogleAdsSent(context.Context, uuid.UUID, time.Time) error {
	f.calls = append(f.calls, "sent")
	return nil
}
func (f *fakeQueue) MarkGoogleAdsRetryable(context.Context, uuid.UUID, string, time.Time) error {
	f.calls = append(f.calls, "retry")
	return nil
}
func (f *fakeQueue) MarkGoogleAdsFailed(context.Context, uuid.UUID, string) error {
	f.calls = append(f.calls, "failed")
	return nil
}
func (f *fakeQueue) ReleaseGoogleAdsClaim(context.Context, uuid.UUID, time.Time) error {
	f.calls = append(f.calls, "release")
	return nil
}
func (f *fakeQueue) RetryGoogleAdsInvoice(context.Context, uuid.UUID, repository.GoogleAdsSnapshot, time.Time) error {
	return nil
}

func TestGoogleAdsWorkerIngestsThenPollsWithoutResubmit(t *testing.T) {
	now := time.Now()
	inv := &model.Invoice{ID: uuid.New(), InvoiceNumber: "INV", Subtotal: 1, PaidAt: &now, Gclid: "click", GoogleAdsCustomerIDSnapshot: "111", GoogleAdsConversionActionIDSnapshot: "222", GoogleAdsServerStatus: model.GoogleAdsConversionProcessing}
	q := &fakeQueue{inv: inv}
	dm := &fakeDM{request: "req"}
	w := NewGoogleAdsWorker(q, dm)
	w.now = func() time.Time { return now }
	ok, err := w.ProcessOne(context.Background())
	if err != nil || !ok || dm.ingests != 1 || len(q.calls) != 2 || q.calls[1] != "persist" {
		t.Fatalf("ingest err=%v calls=%v", err, q.calls)
	}
	inv.GoogleAdsServerRequestID = "req"
	q.inv = inv
	dm.status = DataManagerRequestStatus{State: "SUCCESS"}
	ok, err = w.ProcessOne(context.Background())
	if err != nil || !ok || dm.ingests != 1 || dm.polls != 1 || q.calls[len(q.calls)-1] != "sent" {
		t.Fatalf("poll err=%v calls=%v", err, q.calls)
	}
}
func TestGoogleAdsWorkerFifthFailureTerminal(t *testing.T) {
	now := time.Now()
	q := &fakeQueue{inv: &model.Invoice{ID: uuid.New(), PaidAt: &now, Gclid: "x", GoogleAdsServerAttemptCount: 4, GoogleAdsServerStatus: model.GoogleAdsConversionProcessing}}
	dm := &fakeDM{err: &DispatchError{Category: "transport", Retryable: true, Summary: "safe"}}
	w := NewGoogleAdsWorker(q, dm)
	_, _ = w.ProcessOne(context.Background())
	if q.calls[len(q.calls)-1] != "failed" {
		t.Fatalf("calls=%v", q.calls)
	}
	if errors.Is(nil, context.Canceled) {
		t.Fatal()
	}
}
