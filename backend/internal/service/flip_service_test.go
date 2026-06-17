package service

import "testing"

// TestFlipBaseHost verifies that any configured/derived Flip base URL is
// normalized to a host-only form, so apiRequest can append the correct version
// per endpoint. Regression guard for the sandbox /v3/pwf/bill 404 bug, where a
// hardcoded /v3 base made every CreateBill fail.
func TestFlipBaseHost(t *testing.T) {
	cases := []struct {
		in   string
		want string
	}{
		// version segment stripped
		{"https://bigflip.id/big_sandbox_api/v3", "https://bigflip.id/big_sandbox_api"},
		{"https://bigflip.id/big_sandbox_api/v2", "https://bigflip.id/big_sandbox_api"},
		{"https://bigflip.id/api/v3", "https://bigflip.id/api"},
		{"https://bigflip.id/api/v2", "https://bigflip.id/api"},
		// trailing slash + version segment
		{"https://bigflip.id/api/v3/", "https://bigflip.id/api"},
		// already host-only -> unchanged
		{"https://bigflip.id/api", "https://bigflip.id/api"},
		{"https://bigflip.id/big_sandbox_api", "https://bigflip.id/big_sandbox_api"},
		// trailing slash only
		{"https://bigflip.id/api/", "https://bigflip.id/api"},
		// whitespace tolerated
		{"  https://bigflip.id/api/v3  ", "https://bigflip.id/api"},
		// constants resolve to host-only
		{flipSandboxHost, "https://bigflip.id/big_sandbox_api"},
		{flipProdHost, "https://bigflip.id/api"},
		// empty stays empty (apiRequest falls back to flipProdHost)
		{"", ""},
	}
	for _, c := range cases {
		if got := flipBaseHost(c.in); got != c.want {
			t.Errorf("flipBaseHost(%q) = %q, want %q", c.in, got, c.want)
		}
	}
}

// TestFlipEndpointURLs asserts the full URL built for each endpoint hits the
// version Flip actually serves: pwf/bill at /v2, disbursement at /v3 (both in
// sandbox and prod). path constants live at the call sites in flip_service.go.
func TestFlipEndpointURLs(t *testing.T) {
	cases := []struct {
		name string
		base string
		path string
		want string
	}{
		{"sandbox bill", flipSandboxHost, "/v2/pwf/bill", "https://bigflip.id/big_sandbox_api/v2/pwf/bill"},
		{"prod bill", flipProdHost, "/v2/pwf/bill", "https://bigflip.id/api/v2/pwf/bill"},
		{"sandbox disbursement", flipSandboxHost, "/v3/disbursement", "https://bigflip.id/big_sandbox_api/v3/disbursement"},
		{"prod disbursement", flipProdHost, "/v3/disbursement", "https://bigflip.id/api/v3/disbursement"},
		{"legacy v3 base bill", "https://bigflip.id/big_sandbox_api/v3", "/v2/pwf/bill", "https://bigflip.id/big_sandbox_api/v2/pwf/bill"},
	}
	for _, c := range cases {
		got := flipBaseHost(c.base) + c.path
		if got != c.want {
			t.Errorf("%s: %q + %q = %q, want %q", c.name, c.base, c.path, got, c.want)
		}
	}
}
