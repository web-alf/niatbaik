# Google Ads Worker Reliability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bound Data Manager polling failures and prevent deliberate duplicate ingest after Google accepts a conversion but local request-ID persistence fails.

**Architecture:** Extend the existing invoice-backed state machine rather than introduce a new queue. Keep `google_ads_server_attempt_count` for ingest, add an independent poll counter, and make `accepted_untracked` terminal/non-claimable. Repository updates own atomic counter/state transitions; worker code only selects transitions.

**Tech Stack:** Go 1.25, GORM, PostgreSQL, existing Go test fakes, TypeScript.

---

## File Structure

- Modify `backend/internal/model/invoice.go`: status constant and persisted poll counter.
- Modify `backend/internal/repository/invoice_repo.go`: atomic poll transitions, accepted-untracked transition, retry guard/reset.
- Modify `backend/internal/service/google_ads_worker.go`: phase-specific bounded retries and persistence-failure fallback.
- Modify `backend/internal/service/google_ads_worker_test.go`: deterministic state-machine tests.
- Modify `backend/internal/service/payment_service.go`: reset poll counter for genuinely new conversion work.
- Modify `backend/internal/service/payment_service_test.go`: reset regression test.
- Modify `backend/internal/service/google_ads_config.go`: preserve terminal accepted-untracked state.
- Modify `backend/internal/handler/invoice_handler.go`: reject manual retry for accepted-untracked.
- Modify `backend/internal/dto/response/invoice.go`: expose independent attempt counters.
- Modify `backend/internal/dto/response/invoice_test.go`: audit response regression test.
- Modify `frontend/src/types/api.ts`: type the new status and counters.

No versioned migration file: this project uses GORM `AutoMigrate` in `backend/internal/database/migrate.go`. No new dependency.

### Task 1: Add persisted state vocabulary

**Files:**
- Modify: `backend/internal/model/invoice.go`
- Test: `backend/internal/service/google_ads_worker_test.go`

- [ ] **Step 1: Write a compile-time failing model test**

Add near the worker tests:

```go
func TestGoogleAdsAcceptedUntrackedStateExists(t *testing.T) {
	inv := model.Invoice{
		GoogleAdsServerStatus:     model.GoogleAdsConversionAcceptedUntracked,
		GoogleAdsPollAttemptCount: 3,
	}
	assert.Equal(t, "accepted_untracked", inv.GoogleAdsServerStatus)
	assert.Equal(t, 3, inv.GoogleAdsPollAttemptCount)
}
```

Use the assertion package already imported by this test file; if it uses standard-library checks, match that style instead.

- [ ] **Step 2: Verify the test fails to compile**

Run from `backend/`:

```bash
go test ./internal/service -run TestGoogleAdsAcceptedUntrackedStateExists -count=1
```

Expected: compile failure for missing `GoogleAdsConversionAcceptedUntracked` and `GoogleAdsPollAttemptCount`.

- [ ] **Step 3: Add the minimal model fields**

In `backend/internal/model/invoice.go`, add beside existing Google Ads constants and attempt fields:

```go
GoogleAdsConversionAcceptedUntracked = "accepted_untracked"
```

```go
GoogleAdsPollAttemptCount int `gorm:"default:0;not null" json:"google_ads_poll_attempt_count"`
```

- [ ] **Step 4: Verify model test passes**

```bash
go test ./internal/service -run TestGoogleAdsAcceptedUntrackedStateExists -count=1
```

Expected: PASS.

- [ ] **Step 5: Commit this isolated change**

```bash
git add backend/internal/model/invoice.go backend/internal/service/google_ads_worker_test.go
git commit -m "feat(tracking): add polling audit state"
```

Do not commit pre-existing changes in `google_data_manager.go` or `google_data_manager_test.go` unless the user explicitly requests it.

### Task 2: Make repository transitions atomic and safe

**Files:**
- Modify: `backend/internal/repository/invoice_repo.go`
- Test: `backend/internal/service/google_ads_worker_test.go` through the repository interface fake

- [ ] **Step 1: Extend the worker repository fake contract first**

Add call recording methods matching the production interface:

```go
func (f *fakeQueue) MarkGoogleAdsPollRetryable(_ context.Context, _ uuid.UUID, _ string, _ time.Time) error {
	f.calls = append(f.calls, "poll_retryable")
	return nil
}

func (f *fakeQueue) MarkGoogleAdsPollFailed(_ context.Context, _ uuid.UUID, _ string) error {
	f.calls = append(f.calls, "poll_failed")
	return nil
}

func (f *fakeQueue) MarkGoogleAdsAcceptedUntracked(_ context.Context, _ uuid.UUID, _ string) error {
	f.calls = append(f.calls, "accepted_untracked")
	return f.acceptedUntrackedErr
}
```

Add `acceptedUntrackedErr error` to `fakeQueue`.

- [ ] **Step 2: Extend `GoogleAdsQueueRepository`**

In `backend/internal/service/google_ads_worker.go`, add:

```go
MarkGoogleAdsPollRetryable(context.Context, uuid.UUID, string, time.Time) error
MarkGoogleAdsPollFailed(context.Context, uuid.UUID, string) error
MarkGoogleAdsAcceptedUntracked(context.Context, uuid.UUID, string) error
```

- [ ] **Step 3: Verify production repository no longer satisfies the interface**

```bash
go test ./internal/service -run TestGoogleAdsAcceptedUntrackedStateExists -count=1
```

Expected: compile failure naming missing methods on `*repository.InvoiceRepo` or the wired repository implementation.

- [ ] **Step 4: Implement atomic repository transitions**

Follow the existing guarded `Model(...).Where(...).Updates(...)` plus `affected(...)` pattern. Add:

```go
func (r *InvoiceRepo) MarkGoogleAdsPollRetryable(ctx context.Context, id uuid.UUID, message string, next time.Time) error {
	return affected(r.db.WithContext(ctx).Model(&model.Invoice{}).
		Where("id = ? AND google_ads_server_status = ?", id, model.GoogleAdsConversionProcessing).
		Updates(map[string]any{
			"google_ads_server_status":      model.GoogleAdsConversionRetryable,
			"google_ads_server_error":       message,
			"google_ads_next_attempt_at":     next,
			"google_ads_processing_at":       nil,
			"google_ads_poll_attempt_count": gorm.Expr("google_ads_poll_attempt_count + 1"),
		}))
}

func (r *InvoiceRepo) MarkGoogleAdsPollFailed(ctx context.Context, id uuid.UUID, message string) error {
	return affected(r.db.WithContext(ctx).Model(&model.Invoice{}).
		Where("id = ? AND google_ads_server_status = ?", id, model.GoogleAdsConversionProcessing).
		Updates(map[string]any{
			"google_ads_server_status":      model.GoogleAdsConversionFailed,
			"google_ads_server_error":       message,
			"google_ads_next_attempt_at":     nil,
			"google_ads_processing_at":       nil,
			"google_ads_poll_attempt_count": gorm.Expr("google_ads_poll_attempt_count + 1"),
		}))
}

func (r *InvoiceRepo) MarkGoogleAdsAcceptedUntracked(ctx context.Context, id uuid.UUID, message string) error {
	return affected(r.db.WithContext(ctx).Model(&model.Invoice{}).
		Where("id = ? AND google_ads_server_status = ?", id, model.GoogleAdsConversionProcessing).
		Updates(map[string]any{
			"google_ads_server_status":  model.GoogleAdsConversionAcceptedUntracked,
			"google_ads_server_error":   message,
			"google_ads_next_attempt_at": nil,
			"google_ads_processing_at":   nil,
		}))
}
```

Adjust exact receiver/DB field names to those already used in the file. Keep the state guard.

- [ ] **Step 5: Harden manual retry**

In `RetryGoogleAdsInvoice`, exclude both terminal states and reset both counters:

```go
Where("id = ? AND google_ads_server_status NOT IN ?", id, []string{
	model.GoogleAdsConversionServerSent,
	model.GoogleAdsConversionAcceptedUntracked,
})
```

Include:

```go
"google_ads_server_attempt_count": 0,
"google_ads_poll_attempt_count":   0,
```

Claim queries already include only explicit claimable statuses; retain that allowlist.

- [ ] **Step 6: Compile repository and service packages**

```bash
go test ./internal/repository ./internal/service -run TestGoogleAdsAcceptedUntrackedStateExists -count=1
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add backend/internal/repository/invoice_repo.go backend/internal/service/google_ads_worker.go backend/internal/service/google_ads_worker_test.go
git commit -m "feat(tracking): add bounded poll transitions"
```

### Task 3: Bound polling errors independently

**Files:**
- Modify: `backend/internal/service/google_ads_worker.go`
- Modify: `backend/internal/service/google_ads_worker_test.go`

- [ ] **Step 1: Upgrade `fakeDM` for phase-specific outcomes**

Replace the shared error with deterministic fields:

```go
type fakeDM struct {
	ingestErr  error
	pollErrors []error
	statuses   []DataManagerRequestStatus
	ingests    int
	polls      int
}
```

`Ingest` returns `ingestErr`. `RetrieveStatus` consumes the error/status at index `polls-1`, retaining the existing default successful status when slices are empty.

- [ ] **Step 2: Write failing fifth-poll-error test**

```go
func TestGoogleAdsWorkerFifthPollingFailureTerminal(t *testing.T) {
	inv := paidTrackingInvoice()
	inv.GoogleAdsServerRequestID = "requests/test"
	inv.GoogleAdsPollAttemptCount = 4
	q := &fakeQueue{inv: &inv}
	dm := &fakeDM{pollErrors: []error{&DispatchError{Category: "upstream", Retryable: true, Summary: "temporary"}}}

	worker := NewGoogleAdsWorker(q, dm)
	require.NoError(t, worker.ProcessOne(context.Background()))
	assert.Equal(t, 0, dm.ingests)
	assert.Equal(t, 1, dm.polls)
	assert.Contains(t, q.calls, "poll_failed")
	assert.NotContains(t, q.calls, "poll_retryable")
}
```

Use the existing worker constructor and fixture names if different; preserve these assertions.

- [ ] **Step 3: Run and verify failure**

```bash
go test ./internal/service -run TestGoogleAdsWorkerFifthPollingFailureTerminal -count=1
```

Expected: FAIL because the worker still uses the ingest counter/shared retry method.

- [ ] **Step 4: Implement phase-specific failure handling**

Add:

```go
const maxGoogleAdsAttempts = 5
```

Keep ingest behavior based on `GoogleAdsServerAttemptCount + 1`. For `RetrieveStatus` errors, use:

```go
attempt := inv.GoogleAdsPollAttemptCount + 1
summary, retryable := dispatchFailure(err)
if !retryable || attempt >= maxGoogleAdsAttempts {
	return w.queue.MarkGoogleAdsPollFailed(ctx, inv.ID, summary)
}
return w.queue.MarkGoogleAdsPollRetryable(ctx, inv.ID, summary, time.Now().Add(retryDelay(attempt)))
```

Extract only a tiny helper if the existing `fail` closure cannot remain readable. Do not count successful `PROCESSING` or `PENDING` responses as failures.

- [ ] **Step 5: Verify fifth failure passes**

```bash
go test ./internal/service -run TestGoogleAdsWorkerFifthPollingFailureTerminal -count=1
```

Expected: PASS.

- [ ] **Step 6: Add remaining poll tests**

Add table/focused tests proving:

```go
// retryable attempt 1 calls poll_retryable, not poll_failed
// permanent attempt 1 calls poll_failed immediately
// a successful status before limit calls the existing sent/reschedule transition
// request ID present means dm.ingests remains zero
// GoogleAdsServerAttemptCount does not determine poll termination
```

Use `DispatchError{Retryable: true}` and `DispatchError{Retryable: false}` directly. Assert exact call names and `dm.ingests`/`dm.polls`.

- [ ] **Step 7: Run focused worker suite**

```bash
go test ./internal/service -run TestGoogleAdsWorker -count=1
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add backend/internal/service/google_ads_worker.go backend/internal/service/google_ads_worker_test.go
git commit -m "fix(tracking): bound Data Manager polling retries"
```

### Task 4: Stop resubmission after remote acceptance

**Files:**
- Modify: `backend/internal/service/google_ads_worker.go`
- Modify: `backend/internal/service/google_ads_worker_test.go`

- [ ] **Step 1: Make request-ID persistence failure injectable**

Add to `fakeQueue`:

```go
persistErr error
```

Return it from `PersistGoogleAdsRequestID` after recording the call.

- [ ] **Step 2: Write failing acceptance-boundary test**

```go
func TestGoogleAdsWorkerPersistenceFailureBecomesAcceptedUntracked(t *testing.T) {
	inv := paidTrackingInvoice()
	q := &fakeQueue{inv: &inv, persistErr: errors.New("db unavailable customer@example.com")}
	dm := &fakeDM{}
	worker := NewGoogleAdsWorker(q, dm)

	err := worker.ProcessOne(context.Background())
	require.Error(t, err)
	assert.Equal(t, 1, dm.ingests)
	assert.Equal(t, 0, dm.polls)
	assert.Contains(t, q.calls, "persist_request_id")
	assert.Contains(t, q.calls, "accepted_untracked")
	assert.NotContains(t, strings.Join(q.persistedMessages, " "), "customer@example.com")
}
```

Extend the fake with `persistedMessages []string`; append messages in terminal/retry methods.

- [ ] **Step 3: Verify the test fails**

```bash
go test ./internal/service -run TestGoogleAdsWorkerPersistenceFailureBecomesAcceptedUntracked -count=1
```

Expected: FAIL because worker returns the DB error without terminal fallback.

- [ ] **Step 4: Implement fixed sanitized fallback**

Immediately after successful ingest:

```go
if err := w.queue.PersistGoogleAdsRequestID(ctx, inv.ID, requestID); err != nil {
	fallbackErr := w.queue.MarkGoogleAdsAcceptedUntracked(ctx, inv.ID, "request ID persistence failed")
	if fallbackErr != nil {
		return errors.Join(err, fallbackErr)
	}
	return err
}
```

Use stdlib `errors.Join`. Never include `requestID`, raw DB error, payload, token, customer ID, action ID, transaction ID, click ID, email, or phone in the persisted summary.

- [ ] **Step 5: Add fallback-write failure coverage**

Set both `persistErr` and `acceptedUntrackedErr`. Assert `ProcessOne` returns an error matching both via `errors.Is`; assert ingest count remains one during this execution.

- [ ] **Step 6: Run worker suite**

```bash
go test ./internal/service -run TestGoogleAdsWorker -count=1
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add backend/internal/service/google_ads_worker.go backend/internal/service/google_ads_worker_test.go
git commit -m "fix(tracking): stop resubmit after remote acceptance"
```

### Task 5: Preserve terminal state across resets and manual retry

**Files:**
- Modify: `backend/internal/service/payment_service.go`
- Modify: `backend/internal/service/payment_service_test.go`
- Modify: `backend/internal/service/google_ads_config.go`
- Modify: `backend/internal/handler/invoice_handler.go`

- [ ] **Step 1: Write failing payment reset assertions**

Extend the existing payment audit-reset fixture with a nonzero `GoogleAdsPollAttemptCount`; assert a genuinely new tracking initialization resets it to zero.

Add a case where current status is `accepted_untracked`; assert status remains `accepted_untracked` rather than becoming claimable.

- [ ] **Step 2: Run focused tests**

```bash
go test ./internal/service -run 'Test.*Payment|Test.*GoogleAdsConfig' -count=1
```

Expected: at least one FAIL for poll reset or terminal-state preservation.

- [ ] **Step 3: Implement minimal reset/preservation**

Where payment code resets the existing ingest counter, add:

```go
inv.GoogleAdsPollAttemptCount = 0
```

In `initialGoogleAdsServerStatus`, preserve both terminal statuses:

```go
if current == model.GoogleAdsConversionServerSent || current == model.GoogleAdsConversionAcceptedUntracked {
	return current
}
```

Do not reset counters/state for an already terminal accepted-untracked conversion.

- [ ] **Step 4: Block handler retry explicitly**

Extend the current `server_sent` guard:

```go
if inv.GoogleAdsServerStatus == model.GoogleAdsConversionServerSent ||
	inv.GoogleAdsServerStatus == model.GoogleAdsConversionAcceptedUntracked {
	// return the existing conflict/bad-request response form
}
```

Repository exclusion from Task 2 remains authoritative against races/direct callers.

- [ ] **Step 5: Run service and handler tests**

```bash
go test ./internal/service ./internal/handler -count=1
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add backend/internal/service/payment_service.go backend/internal/service/payment_service_test.go backend/internal/service/google_ads_config.go backend/internal/handler/invoice_handler.go
git commit -m "fix(tracking): preserve untracked acceptance state"
```

### Task 6: Expose independent audit counters safely

**Files:**
- Modify: `backend/internal/dto/response/invoice.go`
- Modify: `backend/internal/dto/response/invoice_test.go`
- Modify: `frontend/src/types/api.ts`

- [ ] **Step 1: Write failing response mapper test**

Extend `TestToInvoiceResponseExposesGoogleAdsAudit`:

```go
inv.GoogleAdsServerStatus = model.GoogleAdsConversionAcceptedUntracked
inv.GoogleAdsServerAttemptCount = 2
inv.GoogleAdsPollAttemptCount = 4

assert.Equal(t, model.GoogleAdsConversionAcceptedUntracked, got.GoogleAdsServerStatus)
assert.Equal(t, 2, got.GoogleAdsServerAttemptCount)
assert.Equal(t, 4, got.GoogleAdsPollAttemptCount)
```

- [ ] **Step 2: Verify response test fails**

```bash
go test ./internal/dto/response -run TestToInvoiceResponseExposesGoogleAdsAudit -count=1
```

Expected: compile failure for missing response fields.

- [ ] **Step 3: Add response fields and mapping**

In `InvoiceResponse`:

```go
GoogleAdsServerAttemptCount int `json:"google_ads_server_attempt_count"`
GoogleAdsPollAttemptCount   int `json:"google_ads_poll_attempt_count"`
```

In the mapper:

```go
GoogleAdsServerAttemptCount: inv.GoogleAdsServerAttemptCount,
GoogleAdsPollAttemptCount:   inv.GoogleAdsPollAttemptCount,
```

Keep `safeInvoiceError`; expose no raw payload or credential.

- [ ] **Step 4: Update frontend type only**

In `frontend/src/types/api.ts`, add:

```ts
googleAdsServerStatus?:
  | 'accepted_untracked'
  // retain every existing member and fallback exactly as-is
googleAdsServerAttemptCount?: number
googleAdsPollAttemptCount?: number
```

No UI behavior is required: current retry-button allowlist excludes the new status.

- [ ] **Step 5: Run backend mapper and frontend build**

```bash
cd backend && go test ./internal/dto/response -count=1
cd ../frontend && bun run build
```

Expected: both PASS.

- [ ] **Step 6: Commit**

```bash
git add backend/internal/dto/response/invoice.go backend/internal/dto/response/invoice_test.go frontend/src/types/api.ts
git commit -m "feat(tracking): expose polling attempt audit"
```

### Task 7: Verify migration behavior and full regression suite

**Files:**
- Verify: `backend/internal/database/migrate.go`
- Verify: all modified files

- [ ] **Step 1: Confirm migration discovery**

Verify `model.Invoice` remains in the existing `AutoMigrate` list. No SQL migration is needed because the new field is additive, non-null, and defaults to zero. Do not invent a rollback test framework absent from this repository.

- [ ] **Step 2: Run formatting and diff checks**

```bash
gofmt -w backend/internal/model/invoice.go backend/internal/repository/invoice_repo.go backend/internal/service/google_ads_worker.go backend/internal/service/google_ads_worker_test.go backend/internal/service/payment_service.go backend/internal/service/payment_service_test.go backend/internal/service/google_ads_config.go backend/internal/handler/invoice_handler.go backend/internal/dto/response/invoice.go backend/internal/dto/response/invoice_test.go
git diff --check
```

Expected: no output from `git diff --check`.

- [ ] **Step 3: Run focused backend tests**

From `backend/`:

```bash
go test ./internal/service -run 'TestGoogleAdsWorker|TestDataManager|Test.*Payment|Test.*GoogleAdsConfig' -count=1
go test ./internal/dto/response ./internal/handler ./internal/repository -count=1
```

Expected: PASS.

- [ ] **Step 4: Run full backend verification**

```bash
go build ./...
go vet ./...
go test ./...
```

Expected: PASS. If local Go is unavailable, run the repository-supported container command instead:

```bash
make test-docker
```

Report the exact unavailable command or failure; never claim unrun checks passed.

- [ ] **Step 5: Run frontend verification**

From `frontend/`:

```bash
bun run build
```

Expected: `tsc` and Vite build PASS.

- [ ] **Step 6: Inspect privacy and state-machine diff**

```bash
git diff -- backend/internal/model/invoice.go backend/internal/repository/invoice_repo.go backend/internal/service/google_ads_worker.go backend/internal/service/google_ads_worker_test.go backend/internal/service/payment_service.go backend/internal/service/google_ads_config.go backend/internal/handler/invoice_handler.go backend/internal/dto/response/invoice.go backend/internal/dto/response/invoice_test.go frontend/src/types/api.ts
```

Confirm:

- `accepted_untracked` never appears in a claim/retry allowlist.
- Raw persistence errors/request IDs are not persisted in fallback diagnostics.
- Poll errors increment only poll count.
- Ingest errors increment only ingest count.
- Successful `PROCESSING`/`PENDING` responses do not consume failure attempts.
- Existing staged Data Manager diagnostics edits remain unaltered except where explicitly tested.

- [ ] **Step 7: Final commit if verification caused formatting-only changes**

```bash
git add <only-files-changed-by-this-plan>
git commit -m "test(tracking): verify worker reliability states"
```

Skip this commit when no new changes exist. Never use `git add .` while unrelated user changes are present.

## Production Validation and Rollback

After code verification, deployment remains a separate user-approved action.

1. Deploy to staging or limited traffic.
2. Submit one sanitized test conversion.
3. Verify ingest call count, persisted request ID, polling transitions, both counters, destination status, and absence of PII in logs.
4. Inject or simulate a request-ID persistence failure only in a non-production environment; verify `accepted_untracked` and no reclaim.
5. Roll back application before schema removal. The additive column is safe to leave in place.
6. Never remap `accepted_untracked` to `retryable` automatically.

Google transaction-ID deduplication remains **unverified** and outside this implementation.