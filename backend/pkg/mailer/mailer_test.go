package mailer

import (
	"strings"
	"testing"
)

func TestStripHeaderValue_RemovesCRLF(t *testing.T) {
	// Classic email header injection: smuggle a Bcc via CRLF in the recipient.
	in := "victim@x.co\r\nBcc: attacker@evil.co"
	got := stripHeaderValue(in)
	if strings.ContainsAny(got, "\r\n") {
		t.Errorf("stripHeaderValue left CR/LF in %q", got)
	}
	if got != "victim@x.coBcc: attacker@evil.co" {
		t.Errorf("unexpected result: %q", got)
	}
}

func TestStripHeaderValue_PlainPassesThrough(t *testing.T) {
	if got := stripHeaderValue("hello@niatbaik.org"); got != "hello@niatbaik.org" {
		t.Errorf("plain value altered: %q", got)
	}
}

func TestSend_FailsOnIncompleteConfig(t *testing.T) {
	// No host/email/password/port → must error out before any network attempt.
	if err := Send(Config{}, "a@b.co", "subj", "<p>hi</p>"); err == nil {
		t.Error("expected error for unconfigured SMTP")
	}
}

func TestSend_RejectsEmptyRecipientAfterStrip(t *testing.T) {
	cfg := Config{Host: "smtp.test", Email: "from@x.co", Password: "pw", Port: 587}
	// A recipient that is only CR/LF collapses to empty and must be rejected.
	if err := Send(cfg, "\r\n", "subj", "body"); err == nil {
		t.Error("expected error for empty recipient after stripping CRLF")
	}
}
