package handler

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"

	"github.com/anrdart/niatbaik-api/internal/dto/response"
	"github.com/anrdart/niatbaik-api/internal/service"
	"github.com/labstack/echo/v4"
)

// isSensitiveHeader reports whether a header may carry the webhook signature or an
// auth credential, so the diagnostic logger redacts its value instead of leaking it.
func isSensitiveHeader(name string) bool {
	switch strings.ToLower(name) {
	case "x-moota-signature", "signature", "x-signature", "authorization", "cookie", "x-api-key", "apikey":
		return true
	}
	return false
}

// mootaSignatureHeaders lists the header names a Moota webhook might carry its HMAC
// signature in. Moota's public docs describe an older `apikey` query + Basic-auth
// scheme and don't name the header for the newer Secret-Token webhook, so we accept
// any of these rather than hard-coding one and silently 401'ing every real mutation
// on a name mismatch. The diagnostic log below records which one actually arrived.
var mootaSignatureHeaders = []string{"X-Moota-Signature", "Signature", "X-Signature"}

// extractMootaSignature returns the first non-empty signature header value found,
// and the header name it came from (for diagnostics).
func extractMootaSignature(c echo.Context) (sig, fromHeader string) {
	for _, name := range mootaSignatureHeaders {
		if v := strings.TrimSpace(c.Request().Header.Get(name)); v != "" {
			return v, name
		}
	}
	return "", ""
}

type WebhookHandler struct {
	mootaService  *service.MootaService
	flipService   *service.FlipService
	xenditService *service.XenditService
}

func NewWebhookHandler(mootaService *service.MootaService, flipService *service.FlipService, xenditService *service.XenditService) *WebhookHandler {
	return &WebhookHandler{mootaService: mootaService, flipService: flipService, xenditService: xenditService}
}

func (h *WebhookHandler) HandleMoota(c echo.Context) error {
	body, err := io.ReadAll(c.Request().Body)
	if err != nil {
		return c.JSON(http.StatusBadRequest, response.ErrorResponse("Failed to read body"))
	}

	// TEMPORARY DIAGNOSTICS — confirm Moota's real signing scheme during setup.
	// Logs every inbound header, a truncated body, the signature header we matched,
	// and our own computed HMAC so we can compare. REMOVE once the header name +
	// encoding are confirmed: it writes request metadata to the server log.
	logMootaInbound(c, body, h.mootaService.ExpectedSignature(body))

	// Moota's dashboard "Check URL" sends an empty-body reachability ping (no
	// signature, no mutation). Acknowledge it with 200 so the URL registers, but ONLY
	// for an empty body — an empty body can never carry a real mutation, so this opens
	// no forgery path. Any non-empty body still requires a valid HMAC signature below.
	if len(strings.TrimSpace(string(body))) == 0 {
		return c.JSON(http.StatusOK, map[string]interface{}{
			"success":   true,
			"processed": []string{},
			"note":      "reachability check ok — empty body, no mutation processed",
		})
	}

	// Honor the Settings → Payment → Moota "Signature Moota" toggle. When an admin
	// turns it OFF, skip verification entirely — a setup-time escape hatch for when
	// Moota's signing scheme hasn't been matched yet. SECURITY: with it off the
	// payment-confirming webhook is unauthenticated (endpoint secrecy is the only
	// guard); it must be re-enabled for normal operation.
	if !h.mootaService.SignatureCheckEnabled() {
		log.Println("[moota-webhook] WARNING: signature check DISABLED via settings — processing unverified mutation")
	} else {
		signature, fromHeader := extractMootaSignature(c)
		if fromHeader != "" {
			log.Printf("[moota-webhook] signature received via header %q", fromHeader)
		}
		ok, reason := h.mootaService.VerifySignature(body, signature)
		if !ok {
			// Distinguish a server-side config gap (no secret saved yet — common during
			// initial setup) from a real auth failure, so Moota's "Check URL" reports a
			// diagnosable status instead of a generic 401.
			if reason == "no webhook secret configured" {
				return c.JSON(http.StatusServiceUnavailable, response.ErrorResponse("Moota webhook secret belum disimpan di Settings → Payment → Moota"))
			}
			return c.JSON(http.StatusUnauthorized, response.ErrorResponse("Invalid signature: "+reason))
		}
	}

	var mutations []service.MootaWebhookPayload
	if err := json.Unmarshal(body, &mutations); err != nil {
		return c.JSON(http.StatusBadRequest, response.ErrorResponse("Invalid payload"))
	}

	processed, err := h.mootaService.HandleWebhook(mutations)
	if err != nil {
		return c.JSON(http.StatusBadRequest, response.ErrorResponse(err.Error()))
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"success":   true,
		"processed": processed,
	})
}

func (h *WebhookHandler) HandleFlip(c echo.Context) error {
	dataStr := c.FormValue("data")
	if dataStr == "" {
		return c.JSON(http.StatusBadRequest, response.ErrorResponse("Missing data field"))
	}

	// Flip sends the validation token as a FORM FIELD named "token" in the same
	// application/x-www-form-urlencoded body as "data" — NOT as a header. Reading only
	// the X-Flip-Validation header meant the token was always empty, so every real
	// callback 401'd and payment status never auto-updated to "Terbayar". Prefer the
	// form field; fall back to the header for manual/legacy callers.
	token := c.FormValue("token")
	if token == "" {
		token = c.Request().Header.Get("X-Flip-Validation")
	}
	if !h.flipService.VerifyWebhookToken(token) {
		return c.JSON(http.StatusUnauthorized, response.ErrorResponse("Invalid token"))
	}

	var payload service.FlipWebhookPayload
	if err := json.Unmarshal([]byte(dataStr), &payload); err != nil {
		return c.JSON(http.StatusBadRequest, response.ErrorResponse("Invalid payload"))
	}

	if err := h.flipService.HandleWebhook(payload); err != nil {
		return c.JSON(http.StatusBadRequest, response.ErrorResponse(err.Error()))
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"success": true,
	})
}

// HandleXendit settles a donation from a Xendit invoice callback. Xendit authenticates the
// webhook with a STATIC token in the X-CALLBACK-TOKEN header (not an HMAC of the body) — we
// constant-time compare it against the dashboard token before trusting the payload.
func (h *WebhookHandler) HandleXendit(c echo.Context) error {
	body, err := io.ReadAll(c.Request().Body)
	if err != nil {
		return c.JSON(http.StatusBadRequest, response.ErrorResponse("Failed to read body"))
	}

	// An empty-body reachability ping (some dashboards probe the URL) — ack so the URL
	// registers; an empty body carries no settlement, so this opens no forgery path.
	if len(strings.TrimSpace(string(body))) == 0 {
		return c.JSON(http.StatusOK, map[string]interface{}{"success": true, "note": "reachability ok"})
	}

	token := c.Request().Header.Get("X-CALLBACK-TOKEN")
	if !h.xenditService.VerifyCallbackToken(token) {
		return c.JSON(http.StatusUnauthorized, response.ErrorResponse("Invalid callback token"))
	}

	var payload service.XenditWebhookPayload
	if err := json.Unmarshal(body, &payload); err != nil {
		return c.JSON(http.StatusBadRequest, response.ErrorResponse("Invalid payload"))
	}

	if err := h.xenditService.HandleWebhook(payload); err != nil {
		// Log server-side so a failed settlement (invoice not found, amount mismatch) is
		// diagnosable — Xendit will retry, so a transient 400 here is recoverable.
		log.Printf("[xendit-webhook] settle failed for external_id=%q: %v", payload.ExternalID, err)
		return c.JSON(http.StatusBadRequest, response.ErrorResponse(err.Error()))
	}

	return c.JSON(http.StatusOK, map[string]interface{}{"success": true})
}

// logMootaInbound dumps inbound Moota webhook metadata to the server log so we can
// confirm Moota's actual signing scheme (which header carries the signature, and
// whether it matches our HMAC-SHA256-hex). TEMPORARY: remove once confirmed.
//
// Auth headers are NOT redacted on purpose — we need to see the raw signature value
// to match the encoding. That's acceptable only because this is a short-lived setup
// diagnostic on a low-traffic endpoint; do not leave it in production.
func logMootaInbound(c echo.Context, body []byte, expectedHMAC string) {
	var b strings.Builder
	b.WriteString("[moota-webhook] ===== inbound =====\n")
	for name, vals := range c.Request().Header {
		b.WriteString("  hdr ")
		b.WriteString(name)
		b.WriteString(": ")
		// Redact secret-bearing headers. Logging the raw signature/auth value handed an
		// attacker with log access valid replay material; we only need to know the header
		// is PRESENT and its length to debug the signing scheme, not its contents.
		if isSensitiveHeader(name) {
			joined := strings.Join(vals, ",")
			b.WriteString(fmt.Sprintf("<redacted, len=%d>", len(joined)))
		} else {
			b.WriteString(strings.Join(vals, ","))
		}
		b.WriteString("\n")
	}
	b.WriteString("  query: ")
	b.WriteString(c.Request().URL.RawQuery)
	b.WriteString("\n")
	bodyStr := string(body)
	if len(bodyStr) > 512 {
		bodyStr = bodyStr[:512] + "...(truncated)"
	}
	b.WriteString("  body(<=512): ")
	b.WriteString(bodyStr)
	b.WriteString("\n")
	b.WriteString("  our HMAC-SHA256(body): ")
	b.WriteString(expectedHMAC)
	log.Println(b.String())
}
