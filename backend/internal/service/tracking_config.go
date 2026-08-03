package service

import (
	"encoding/json"
	"fmt"
	"regexp"
	"strings"
)

// maxTrackers bounds the unified domain tracking array so a runaway config can't
// bloat the settings row or the public payload.
const maxTrackers = 20

// trackerValuePattern validates each tracker id per platform. These guard the
// exact strings later injected into gtag/fbq/ttq calls and the GTM script URL, so
// they are the XSS boundary: anything that fails is rejected, never rendered.
var trackerValuePattern = map[string]*regexp.Regexp{
	"gtm":        regexp.MustCompile(`^GTM-[A-Z0-9]+$`),
	"google_ads": regexp.MustCompile(`^AW-\d+$`),
	"ga4":        regexp.MustCompile(`^G-[A-Z0-9]+$`),
	"meta":       regexp.MustCompile(`^\d{6,20}$`),
	"tiktok":     regexp.MustCompile(`^[A-Z0-9]+$`),
}

// trackerLabelPattern validates the google_ads conversion label (the part after
// the slash in send_to: AW-<id>/<label>).
var trackerLabelPattern = regexp.MustCompile(`^[A-Za-z0-9_-]+$`)

// trackerSlugPattern validates a campaign slug used to scope a tracker.
var trackerSlugPattern = regexp.MustCompile(`^[a-z0-9]+(?:-[a-z0-9]+)*$`)

// validTrackerScopes are the allowed scope values. Empty input defaults to "global"
// (applies everywhere), preserving backward compatibility.
var validTrackerScopes = map[string]bool{"global": true, "campaigns": true, "off": true}

// forbiddenTrackerKeys mirrors normalizeConversionConfig: a public, browser-bound
// blob must never carry secrets even if a client tries to smuggle them in.
var forbiddenTrackerKeys = map[string]bool{
	"client_secret":   true,
	"refresh_token":   true,
	"developer_token": true,
	"access_token":    true,
	"api_key":         true,
}

// normalizeTrackingConfig validates and canonicalizes the unified domain tracking
// array. Supports multiple ids of the same type. Empty input yields "". Any
// malformed shape, unknown type, bad id, missing google_ads label, forbidden key,
// or over-limit array is a validation error. Foreign fields are dropped and exact
// (type,value) duplicates collapsed.
func normalizeTrackingConfig(raw string) (string, error) {
	if strings.TrimSpace(raw) == "" {
		return "", nil
	}
	var items []map[string]any
	if err := json.Unmarshal([]byte(raw), &items); err != nil {
		return "", fmt.Errorf("tracking_config harus berupa JSON array")
	}
	if len(items) > maxTrackers {
		return "", fmt.Errorf("tracking_config maksimal %d tracker", maxTrackers)
	}

	type tracker struct {
		Type      string   `json:"type"`
		Value     string   `json:"value"`
		Label     string   `json:"label,omitempty"`
		Scope     string   `json:"scope"`
		Campaigns []string `json:"campaigns,omitempty"`
	}
	out := make([]tracker, 0, len(items))
	seen := map[string]bool{}

	for _, item := range items {
		for key := range item {
			if forbiddenTrackerKeys[strings.ToLower(key)] {
				return "", fmt.Errorf("tracking_config tidak boleh menyimpan %s", key)
			}
		}
		typ, _ := item["type"].(string)
		typ = strings.TrimSpace(strings.ToLower(typ))
		pattern, ok := trackerValuePattern[typ]
		if !ok {
			return "", fmt.Errorf("tracking_config tipe tidak dikenal: %q", typ)
		}
		value, _ := item["value"].(string)
		value = strings.TrimSpace(value)
		if typ == "google_ads" && value != "" && !strings.HasPrefix(strings.ToUpper(value), "AW-") {
			value = "AW-" + value // accept bare numeric like the client's awId()
		}
		if !pattern.MatchString(value) {
			return "", fmt.Errorf("tracking_config nilai %q tidak valid untuk tipe %s", value, typ)
		}
		label := ""
		if raw, ok := item["label"].(string); ok {
			label = strings.TrimSpace(raw)
		}
		if typ == "google_ads" {
			if !trackerLabelPattern.MatchString(label) {
				return "", fmt.Errorf("tracking_config google_ads wajib label yang valid")
			}
		} else {
			label = ""
		}

		// Scope: global (default) | campaigns (restrict to selected slugs) | off (saved, not injected).
		scope, _ := item["scope"].(string)
		scope = strings.TrimSpace(strings.ToLower(scope))
		if scope == "" {
			scope = "global"
		}
		if !validTrackerScopes[scope] {
			return "", fmt.Errorf("tracking_config scope tidak dikenal: %q", scope)
		}
		var campaigns []string
		if scope == "campaigns" {
			rawList, _ := item["campaigns"].([]any)
			seenCamp := map[string]bool{}
			for _, c := range rawList {
				slug, _ := c.(string)
				slug = strings.TrimSpace(slug)
				if !trackerSlugPattern.MatchString(slug) {
					return "", fmt.Errorf("tracking_config campaign slug tidak valid: %q", slug)
				}
				if seenCamp[slug] {
					continue // silently collapse repeats within one tracker
				}
				seenCamp[slug] = true
				campaigns = append(campaigns, slug)
			}
			if len(campaigns) == 0 {
				return "", fmt.Errorf("tracking_config scope=campaigns wajib minimal satu campaign")
			}
		}

		// Dedup key includes scope+campaigns so the same id can exist as global AND scoped.
		dedupKey := typ + "|" + value + "|" + scope
		if scope == "campaigns" {
			dedupKey += "|" + strings.Join(campaigns, ",")
		}
		if seen[dedupKey] {
			continue
		}
		seen[dedupKey] = true
		out = append(out, tracker{Type: typ, Value: value, Label: label, Scope: scope, Campaigns: campaigns})
	}

	if len(out) == 0 {
		return "", nil
	}
	encoded, err := json.Marshal(out)
	if err != nil {
		return "", err
	}
	return string(encoded), nil
}
