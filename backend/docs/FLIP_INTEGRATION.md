# Flip Payment Gateway — Integration & Go-Live Guide

NiatBaik uses **Flip (Big Flip Business)** as its automatic payment gateway. When
Flip is enabled, every donation method (QRIS / Virtual Account / e-wallet) is
settled through Flip's hosted **Accept Payment** bill, and the campaign is credited
automatically when Flip sends a `SUCCESSFUL` webhook. **Moota is NOT used for
donation reconciliation** — it only mirrors the owner's bank balance.

This document describes what is already implemented, how the pieces fit, and the
exact steps to take it live. It does **not** turn Flip on — that requires real
credentials and sandbox testing the maintainer must perform.

---

## 1. What is already implemented (code)

| Piece | Location | Notes |
|---|---|---|
| Bill creation | `internal/service/flip_service.go` → `CreateBill` | `POST /pwf/bill`, returns `link_url` / `payment_url` (donor is redirected here). |
| Gateway routing | `internal/service/donation_service.go` → `CreateDonation` | When `FlipEnabled`, `isGateway=true` → no unique code, Flip bill created. On Flip failure, falls back to manual transfer + unique code. |
| Webhook receiver | `internal/handler/webhook_handler.go` → `HandleFlip` (`POST /api/webhooks/flip`) | Reads form field `data`, verifies the `X-Flip-Validation` token, unmarshals payload. |
| Webhook processing | `flip_service.go` → `HandleWebhook` | Only acts on `Status == "SUCCESSFUL"`; extracts `INV-…` from `bill_title`; **verifies `payload.Amount >= invoice.Total`** before crediting; calls `PaymentService.ProcessPayment` (idempotent). |
| Token verification | `flip_service.go` → `VerifyWebhookToken` | Constant-time compare; **fail-closed** if no token configured. |
| Payouts (optional) | `flip_service.go` → `CreateDisbursement` | `POST /disbursement` for paying campaign owners. Not wired to the withdrawal-approval flow yet (see §5). |
| Sandbox/Prod switch | `flip_service.go` → `getCredentials` | If no explicit base URL is set, derives it from the **Flip Mode** setting (`sandbox` → `bigflip.id/big_sandbox_api/v3`, else production). |

Credentials resolve in this order: **Settings (DB) when `flip_enabled=true`**, else
env (`FLIP_SECRET_KEY`, `FLIP_VALIDATION_TOKEN`, `FLIP_BASE_URL`). Secrets are
write-only in the admin UI (blank = keep existing) and never returned by the API.

---

## 2. Settings → Payment fields (admin)

- **Flip Mode** — `sandbox` or `production` (drives the API base URL).
- **Flip API Secret Key** — from the Flip Business dashboard (Production or Sandbox).
- **Flip Validation Token** — Flip dashboard → Settings → API & Webhook. Must match
  the `X-Flip-Validation` header Flip sends.
- **URL Callback** — set in the Flip dashboard to:
  `https://donasi.niatbaik.org/api/webhooks/flip`
- **Flip Auto Redirect**, **Flip Charge Fee** (merchant/donor) — stored; wire into
  `CreateBill` params if/when you want them enforced.
- **Enable Flip** — the master toggle. While OFF, donations use manual transfer +
  unique code (Moota/manual reconciliation).

---

## 3. End-to-end flow (when enabled)

```
Donor submits donation
  → donation_service.CreateDonation: isGateway (Flip on) → no unique code
  → flip_service.CreateBill → Flip /pwf/bill → {link_id, payment_url}
  → invoice.QrURL = payment_url, invoice.PayCode = link_id, TypePayment = "Flip"
  → frontend shows/redirects to Flip payment page
Donor pays on Flip
  → Flip POSTs webhook to /api/webhooks/flip (form field `data`, header X-Flip-Validation)
  → HandleFlip verifies token → HandleWebhook
  → if Status==SUCCESSFUL and amount >= invoice.Total → ProcessPayment
  → invoice.IsPaid=true, status "Terbayar"; campaign + global balances credited
  → donor's confirmation page polling flips to "Pembayaran Diterima"
```

---

## 4. Go-live checklist

1. **Create a Flip Business account** and complete KYC/verification.
2. **Sandbox first.** In Settings → Payment: set Flip Mode = `sandbox`, paste the
   **sandbox** Secret Key + Validation Token, enable Flip.
3. In the **Flip sandbox dashboard**, set the webhook/callback URL to your reachable
   host: `https://<host>/api/webhooks/flip`. (For local testing, expose via a tunnel
   like ngrok/cloudflared.)
4. **Make a test donation** end to end:
   - Submit a donation → confirm an invoice is created with `TypePayment="Flip"` and
     a non-empty `payment_url`.
   - Pay on the Flip sandbox page using Flip's test instructions.
   - Confirm the webhook arrives (check API logs), the invoice flips to `Terbayar`,
     and the campaign balance increases by `Subtotal − admin_fee`.
   - Verify the amount guard: a partial/underpayment must NOT settle.
5. **Verify token security:** a webhook with a wrong/missing `X-Flip-Validation`
   must be rejected (401). Confirm in logs.
6. **Switch to production:** set Flip Mode = `production`, replace with the
   **production** Secret Key + Validation Token, update the Flip dashboard callback
   URL to the production host, keep Flip enabled.
7. **Smoke test in production** with a small real donation, then refund/settle per
   your finance process.
8. **Monitor** the first days: API logs for `[donation]` Flip failures and webhook
   rejections; reconcile Flip dashboard payouts vs campaign balances.

---

## 5. Known gaps / TODO before relying fully on Flip

- **Webhook idempotency by event id:** `ProcessPayment` is idempotent per invoice
  (won't double-credit), but Flip's `payload.ID` is not separately deduped. Fine for
  the single-invoice model; revisit if Flip ever sends multiple events per invoice.
- **Disbursement not wired to withdrawals:** `CreateDisbursement` exists but the
  admin withdrawal-approval flow still records a manual cash-out. Wire it if you want
  automated payouts to campaign owners via Flip.
- **Charge-fee / auto-redirect settings** are stored but not yet passed into
  `CreateBill`. Add them to the `url.Values` in `CreateBill` if you need Flip to
  apply them.
- **No live gateway test in CI:** all Flip calls hit the network, so they can't be
  unit-tested headlessly. Rely on the sandbox checklist above.
