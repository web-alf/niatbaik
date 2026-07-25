# Google Ads Worker Reliability Design

Date: 2026-07-24
Status: Approved design

## Scope

Fix two verified reliability risks in the Google Ads Data Manager worker:

1. Retryable status-polling failures can continue indefinitely because only ingest attempts are counted.
2. A successful remote ingest can be repeated when persisting its request ID fails locally.

No unrelated tracking refactor. Existing uncommitted Data Manager diagnostics changes remain intact.

## Verified Context

The durable worker currently performs:

1. Claim an eligible paid invoice.
2. Submit the conversion to Google Data Manager.
3. Persist the returned request ID.
4. Poll request status.
5. Persist the terminal audit result.

The current attempt counter covers ingest failures. Polling failures do not increment it. A stale processing record without a persisted request ID can be reclaimed and ingested again.

Google-side deduplication for a repeated ingest with the same transaction ID is not assumed. It requires separate official-documentation verification.

## State Model

Keep `google_ads_server_attempt_count` as the ingest-attempt counter. Add `google_ads_poll_attempt_count` for status retrieval.

Add terminal status `accepted_untracked`:

- Google accepted the ingest and returned a request ID.
- Local request-ID persistence failed.
- The invoice must not be automatically claimed or ingested again.
- Reconciliation is manual until safe upstream lookup or documented idempotency exists.

Transitions:

```text
pending
  -> processing
      -> polling                 ingest accepted; request ID persisted
          -> success             destination reports success
          -> failed              permanent polling failure or retry limit
          -> polling             retryable polling failure below limit
      -> accepted_untracked      ingest accepted; request ID persistence failed
      -> pending                 retryable ingest failure below limit
      -> failed                  permanent ingest failure or retry limit
```

Existing names may differ. Implementation must preserve repository conventions while enforcing these semantics.

## Retry Semantics

- Ingest and polling each have a maximum of five attempts.
- Retry only errors classified as retryable by the existing client contract.
- Permanent failures become terminal immediately.
- Polling failures increment only `google_ads_poll_attempt_count`.
- Ingest failures increment only `google_ads_server_attempt_count`.
- Existing queue scheduling/backoff remains unchanged unless its current API cannot represent polling retries.
- No automatic ingest retry occurs after remote acceptance.

## Persistence Boundary

Remote acceptance and local persistence cannot share a transaction. Therefore:

1. Call ingest once for a claimed invoice.
2. On ingest failure, use normal bounded ingest retry behavior.
3. On ingest success, persist the request ID.
4. On persistence failure, make the invoice non-claimable as `accepted_untracked` using the safest available repository operation.
5. Emit a sanitized structured diagnostic for manual reconciliation.

If the same failed DB operation prevents recording `accepted_untracked`, the worker must still avoid intentionally resubmitting within the current execution. Recovery after total DB unavailability remains an operational unknown; solving it requires a larger transactional-outbox or upstream-idempotency design and is outside this patch.

## Observability and Privacy

Persist and log only sanitized diagnostics:

- Internal invoice ID.
- Processing phase: `ingest`, `persist_request_id`, or `poll`.
- Relevant attempt count.
- Error category and sanitized summary.
- Request ID only when existing redaction policy permits it; otherwise a stable masked form.

Never persist or log OAuth credentials, raw customer data, click identifiers, conversion payloads, or PII. Existing diagnostics redaction tests must continue passing.

## Database Migration

Forward migration:

- Add non-null `google_ads_poll_attempt_count` with default `0`.
- Extend the tracking-status constraint or enum with `accepted_untracked` if one exists.
- Preserve existing rows and ingest attempt counts.

Application compatibility:

- Claim queries must exclude `accepted_untracked`.
- Admin/audit serialization must represent the new status safely.
- Existing records default to zero polling attempts.

Rollback sequence:

1. Deploy an application version that treats `accepted_untracked` as terminal and tolerates the new column.
2. Ensure no newer binaries remain active.
3. Remove the status/column only if operationally required.
4. Never remap `accepted_untracked` to a claimable status automatically.

## Tests

Add focused tests proving:

1. Five retryable polling failures become terminal.
2. Polling succeeds before reaching the limit.
3. A permanent polling failure becomes terminal immediately.
4. Successful ingest followed by request-ID persistence failure records `accepted_untracked`.
5. `accepted_untracked` rows cannot be reclaimed, including after the stale-claim interval.
6. Ingest is not called a second time after remote acceptance in the persistence-failure scenario.
7. Ingest and polling counters change independently.
8. Sanitized errors contain no configured credentials, customer/action/transaction IDs, click IDs, or supplied PII fixtures.
9. Migration applies and rolls back under the repository's existing migration test mechanism.
10. Existing backend tests remain green.

## Validation

### Client

No browser behavior changes. Confirm conversion source data and consent behavior remain unchanged by regression tests or existing fixtures.

### Server

Use deterministic fakes to inject ingest, persistence, and polling failures. Verify state, counters, scheduling, claimability, call counts, and sanitized diagnostics after every transition.

### Destination

No production test conversion is required for the local state-machine patch. Before production rollout, use a sanitized test conversion in an approved environment to confirm ingest and status retrieval still match the current Data Manager API.

### Duplicate Protection

The primary proof is local: after simulated remote acceptance plus local persistence failure, the fake ingest client receives exactly one call and the row becomes non-claimable.

### Privacy

Search captured logs and persisted errors for all sensitive test fixtures. Any match fails validation.

## Risks

- `accepted_untracked` may require UI/API consumers to accept a new status.
- A DB outage can prevent both request-ID persistence and fallback status persistence.
- Separate counters slightly expand migration and repository surface area.
- Tight polling limits may terminally fail long transient outages; manual retry remains preferable to unbounded load and silent duplicate risk.

## Definition of Done

- Retryable polling is bounded to five attempts.
- Ingest and polling attempts are independently observable.
- No deliberate second ingest occurs after remote acceptance.
- Persistence failure after acceptance produces a terminal, non-claimable audit state when DB writes remain possible.
- New and existing tests pass.
- Migration forward/rollback behavior is verified.
- Logs and persisted diagnostics contain no fixture secrets or PII.
- Deployment and rollback preserve `accepted_untracked` as non-claimable.

## Explicit Unknowns

- Google Data Manager idempotency or deduplication behavior for repeated transaction IDs.
- An upstream request-status recovery mechanism when the request ID was returned but never persisted.
- Production database constraints outside repository migrations.

These unknowns do not justify automatic resubmission.