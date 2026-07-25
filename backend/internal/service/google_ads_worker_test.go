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
	ingestErr      error
	pollErr        error
}

func (f *fakeDM) Ingest(context.Context, GoogleAdsConversion, bool) (string, error) {
	f.ingests++
	return f.request, f.ingestErr
}
func (f *fakeDM) RetrieveStatus(context.Context, string) (DataManagerRequestStatus, error) {
	f.polls++
	return f.status, f.pollErr
}

type fakeQueue struct {
	inv                  *model.Invoice
	calls                []string
	messages             []string
	persistErr           error
	acceptedUntrackedErr error
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
	return f.persistErr
}
func (f *fakeQueue) MarkGoogleAdsSent(context.Context, uuid.UUID, time.Time) error {
	f.calls = append(f.calls, "sent")
	return nil
}
func (f *fakeQueue) MarkGoogleAdsRetryable(context.Context, uuid.UUID, string, time.Time) error {
	f.calls = append(f.calls, "retry")
	return nil
}
func (f *fakeQueue) MarkGoogleAdsFailed(_ context.Context, _ uuid.UUID, summary string) error {
	f.calls = append(f.calls, "failed")
	f.messages = append(f.messages, summary)
	return nil
}
func (f *fakeQueue) MarkGoogleAdsPollRetryable(_ context.Context, _ uuid.UUID, summary string, _ time.Time) error {
	f.calls = append(f.calls, "poll_retry")
	f.messages = append(f.messages, summary)
	return nil
}
func (f *fakeQueue) MarkGoogleAdsPollFailed(_ context.Context, _ uuid.UUID, summary string) error {
	f.calls = append(f.calls, "poll_failed")
	f.messages = append(f.messages, summary)
	return nil
}
func (f *fakeQueue) MarkGoogleAdsAcceptedUntracked(_ context.Context, _ uuid.UUID, summary string) error {
	f.calls = append(f.calls, "accepted_untracked")
	f.messages = append(f.messages, summary)
	return f.acceptedUntrackedErr
}
func (f *fakeQueue) ReleaseGoogleAdsClaim(context.Context, uuid.UUID, time.Time) error {
	f.calls = append(f.calls, "release")
	return nil
}
func (f *fakeQueue) RetryGoogleAdsInvoice(context.Context, uuid.UUID, repository.GoogleAdsSnapshot, time.Time) error {
	return nil
}

func TestGoogleAdsAcceptedUntrackedStateExists(t *testing.T) {
	inv := model.Invoice{
		GoogleAdsServerStatus:     model.GoogleAdsConversionAcceptedUntracked,
		GoogleAdsPollAttemptCount: 3,
	}
	if inv.GoogleAdsServerStatus != "accepted_untracked" || inv.GoogleAdsPollAttemptCount != 3 {
		t.Fatalf("status=%q poll_attempts=%d", inv.GoogleAdsServerStatus, inv.GoogleAdsPollAttemptCount)
	}
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
func TestGoogleAdsWorkerFifthPollingFailureTerminal(t *testing.T) {
	now := time.Now()
	q := &fakeQueue{inv: &model.Invoice{ID: uuid.New(), GoogleAdsServerRequestID: "req", GoogleAdsPollAttemptCount: 4, GoogleAdsServerStatus: model.GoogleAdsConversionProcessing}}
	dm := &fakeDM{pollErr: &DispatchError{Category: "transport", Retryable: true, Summary: "safe"}}
	w := NewGoogleAdsWorker(q, dm)
	w.now = func() time.Time { return now }
	_, _ = w.ProcessOne(context.Background())
	if dm.ingests != 0 || dm.polls != 1 || q.calls[len(q.calls)-1] != "poll_failed" {
		t.Fatalf("ingests=%d polls=%d calls=%v", dm.ingests, dm.polls, q.calls)
	}
}

func TestGoogleAdsWorkerPersistenceFailureBecomesAcceptedUntracked(t *testing.T) {
	now := time.Now()
	q := &fakeQueue{inv: &model.Invoice{ID: uuid.New(), InvoiceNumber: "INV", PaidAt: &now, Gclid: "x", GoogleAdsServerStatus: model.GoogleAdsConversionProcessing}, persistErr: errors.New("db unavailable customer@example.com")}
	dm := &fakeDM{request: "secret-request-id"}
	w := NewGoogleAdsWorker(q, dm)
	_, err := w.ProcessOne(context.Background())
	if err == nil || dm.ingests != 1 || dm.polls != 0 || q.calls[len(q.calls)-1] != "accepted_untracked" {
		t.Fatalf("err=%v ingests=%d polls=%d calls=%v", err, dm.ingests, dm.polls, q.calls)
	}
	if q.messages[len(q.messages)-1] != "request ID persistence failed" {
		t.Fatalf("unsafe message=%q", q.messages[len(q.messages)-1])
	}
}

func TestGoogleAdsWorkerFifthFailureTerminal(t *testing.T) {
	now := time.Now()
	q := &fakeQueue{inv: &model.Invoice{ID: uuid.New(), PaidAt: &now, Gclid: "x", GoogleAdsServerAttemptCount: 4, GoogleAdsServerStatus: model.GoogleAdsConversionProcessing}}
	dm := &fakeDM{ingestErr: &DispatchError{Category: "transport", Retryable: true, Summary: "safe"}}
	w := NewGoogleAdsWorker(q, dm)
	_, _ = w.ProcessOne(context.Background())
	if q.calls[len(q.calls)-1] != "failed" {
		t.Fatalf("calls=%v", q.calls)
	}
	if errors.Is(nil, context.Canceled) {
		t.Fatal()
	}
}
