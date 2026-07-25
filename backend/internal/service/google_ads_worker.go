package service

import (
	"context"
	"errors"
	"github.com/anrdart/niatbaik-api/internal/model"
	"github.com/anrdart/niatbaik-api/internal/repository"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"time"
)

type GoogleAdsQueueRepository interface {
	ClaimGoogleAdsDue(context.Context, time.Time) (*model.Invoice, error)
	StartGoogleAdsSubmission(context.Context, uuid.UUID, time.Time) error
	PersistGoogleAdsRequestID(context.Context, uuid.UUID, string, time.Time) error
	MarkGoogleAdsSent(context.Context, uuid.UUID, time.Time) error
	MarkGoogleAdsRetryable(context.Context, uuid.UUID, string, time.Time) error
	MarkGoogleAdsFailed(context.Context, uuid.UUID, string) error
	MarkGoogleAdsPollRetryable(context.Context, uuid.UUID, string, time.Time) error
	MarkGoogleAdsPollFailed(context.Context, uuid.UUID, string) error
	MarkGoogleAdsAcceptedUntracked(context.Context, uuid.UUID, string) error
	ReleaseGoogleAdsClaim(context.Context, uuid.UUID, time.Time) error
	RetryGoogleAdsInvoice(context.Context, uuid.UUID, repository.GoogleAdsSnapshot, time.Time) error
}
type GoogleAdsWorker struct {
	repo                 GoogleAdsQueueRepository
	client               DataManagerClient
	wake                 chan struct{}
	scanEvery, pollEvery time.Duration
	now                  func() time.Time
}

func NewGoogleAdsWorker(repo GoogleAdsQueueRepository, client DataManagerClient) *GoogleAdsWorker {
	return &GoogleAdsWorker{repo: repo, client: client, wake: make(chan struct{}, 1), scanEvery: 30 * time.Second, pollEvery: 15 * time.Second, now: time.Now}
}
func (w *GoogleAdsWorker) Signal() {
	select {
	case w.wake <- struct{}{}:
	default:
	}
}
func (w *GoogleAdsWorker) Run(ctx context.Context) error {
	t := time.NewTicker(w.scanEvery)
	defer t.Stop()
	for {
		for {
			ok, err := w.ProcessOne(ctx)
			if err != nil && !errors.Is(err, context.Canceled) {
				break
			}
			if !ok {
				break
			}
		}
		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-w.wake:
		case <-t.C:
		}
	}
}

var retryDelays = []time.Duration{time.Minute, 5 * time.Minute, 15 * time.Minute, time.Hour, 6 * time.Hour}

func (w *GoogleAdsWorker) ProcessOne(ctx context.Context) (bool, error) {
	now := w.now()
	inv, err := w.repo.ClaimGoogleAdsDue(ctx, now)
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return false, nil
	}
	if err != nil {
		return false, err
	}
	if ctx.Err() != nil {
		_ = w.repo.ReleaseGoogleAdsClaim(context.Background(), inv.ID, now)
		return true, ctx.Err()
	}
	fail := func(err error, submission bool) error {
		summary := "dispatch failed"
		retryable := false
		if d, ok := err.(*DispatchError); ok {
			summary = d.Summary
			retryable = d.Retryable
		}
		attempts := inv.GoogleAdsServerAttemptCount
		if submission {
			attempts++
		}
		if !retryable || attempts >= 5 {
			return w.repo.MarkGoogleAdsFailed(ctx, inv.ID, safeSummary(summary))
		}
		idx := attempts - 1
		if idx < 0 {
			idx = 0
		}
		return w.repo.MarkGoogleAdsRetryable(ctx, inv.ID, safeSummary(summary), now.Add(retryDelays[idx]))
	}
	if inv.GoogleAdsServerRequestID == "" {
		if err := w.repo.StartGoogleAdsSubmission(ctx, inv.ID, now); err != nil {
			return true, err
		}
		kind, value := selectGoogleAdsIdentifier(inv)
		requestID, err := w.client.Ingest(ctx, GoogleAdsConversion{CustomerID: inv.GoogleAdsCustomerIDSnapshot, LoginCustomerID: inv.GoogleAdsLoginCustomerIDSnapshot, ConversionActionID: inv.GoogleAdsConversionActionIDSnapshot, Timestamp: *inv.PaidAt, Value: inv.Subtotal, Currency: "IDR", TransactionID: inv.InvoiceNumber, IdentifierKind: kind, IdentifierValue: value}, false)
		if err != nil {
			return true, fail(err, true)
		}
		if err := w.repo.PersistGoogleAdsRequestID(ctx, inv.ID, requestID, now.Add(w.pollEvery)); err != nil {
			fallbackErr := w.repo.MarkGoogleAdsAcceptedUntracked(ctx, inv.ID, "request ID persistence failed")
			return true, errors.Join(err, fallbackErr)
		}

		return true, nil
	}
	st, err := w.client.RetrieveStatus(ctx, inv.GoogleAdsServerRequestID)
	if err != nil {
		summary, retryable := "dispatch failed", false
		if d, ok := err.(*DispatchError); ok {
			summary, retryable = d.Summary, d.Retryable
		}
		attempt := inv.GoogleAdsPollAttemptCount + 1
		if !retryable || attempt >= len(retryDelays) {
			return true, w.repo.MarkGoogleAdsPollFailed(ctx, inv.ID, safeSummary(summary))
		}
		return true, w.repo.MarkGoogleAdsPollRetryable(ctx, inv.ID, safeSummary(summary), now.Add(retryDelays[attempt-1]))
	}
	switch st.State {
	case "SUCCESS":
		return true, w.repo.MarkGoogleAdsSent(ctx, inv.ID, now)
	case "PROCESSING", "PENDING":
		return true, w.repo.MarkGoogleAdsRetryable(ctx, inv.ID, "", now.Add(w.pollEvery))
	case "PARTIAL_SUCCESS", "FAILED":
		return true, w.repo.MarkGoogleAdsFailed(ctx, inv.ID, st.Summary)
	default:
		return true, w.repo.MarkGoogleAdsFailed(ctx, inv.ID, "invalid upstream state")
	}
}
