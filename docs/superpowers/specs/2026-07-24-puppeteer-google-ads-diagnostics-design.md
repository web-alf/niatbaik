# Puppeteer Google Ads Diagnostics Design

Date: 2026-07-24
Status: Approved

## Goal

Reproduce and classify the HTTP 502 produced by the Google Ads Server-side Test Connection flow in local Docker and production without collecting credentials or persistent browser authentication data.

## Approach

Use `puppeteer-core` with an already installed local Chrome/Chromium binary. Do not download a bundled browser. Add one diagnostic script under the frontend tooling surface.

The script opens a visible browser. The operator logs in manually. After login, the script navigates to the settings page, waits for the operator to trigger Test Connection, and captures only the matching `/api/settings/google-ads/test` request outcome.

## Captured Evidence

- Environment label: local or production.
- Sanitized page origin.
- Request method and pathname.
- HTTP status.
- Response `Content-Type`.
- Request duration.
- Sanitized response body with bearer tokens, cookies, known secret-shaped fields, email, and phone values removed.
- Browser console errors excluding argument payloads.
- Screenshot after the response.

The script must not record request headers, request bodies, cookies, local storage, session storage, passwords, bearer tokens, OAuth credentials, or raw customer data.

## Operation

Local first:

1. Start the existing local stack.
2. Run diagnostics against the local frontend URL.
3. Log in manually with a test account.
4. Open the Google Ads settings section.
5. Click Test Connection.
6. Inspect the sanitized artifact.

Production second:

1. Run the same script with an explicitly supplied HTTPS production URL.
2. Log in manually.
3. Click Test Connection.
4. Capture only the test endpoint response.
5. Close the browser; no profile is persisted.

## Storage

Write artifacts to `frontend/.diagnostics/google-ads/`. Add this directory to `.gitignore`. File names contain environment and timestamp only. No artifact is committed.

## Failure Classification

- Immediate JSON 502: backend-generated; parse diagnostic category.
- Immediate non-JSON 502: reverse proxy/backend communication failure.
- Approximately proxy-timeout duration: upstream timeout candidate.
- OAuth rejection category: OAuth configuration/token failure.
- Data Manager rejection category: API permission, account hierarchy, schema, or destination validation failure.

## Validation

- Unit-check sanitizer with fixtures containing bearer token, cookie, OAuth fields, email, phone, customer ID, and benign Google error text.
- Run script locally and verify no forbidden values appear in the artifact.
- Build frontend after dependency installation.
- Review `git status` to ensure artifacts remain ignored.

## Boundaries

This tool diagnoses the failure. It does not alter application behavior, retry logic, OAuth configuration, Google settings, or production data. Production login remains manual.