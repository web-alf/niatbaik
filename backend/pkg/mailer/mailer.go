package mailer

import (
	"fmt"
	"net/smtp"
	"strings"
)

// Config holds SMTP credentials loaded from settings.
type Config struct {
	Host     string
	Port     int
	Email    string
	Password string
	Name     string
}

// Send delivers a plain-text/HTML email via SMTP using STARTTLS auth.
// Returns an error if the SMTP config is incomplete or delivery fails.
func Send(cfg Config, to, subject, htmlBody string) error {
	if cfg.Host == "" || cfg.Email == "" || cfg.Password == "" || cfg.Port == 0 {
		return fmt.Errorf("smtp not configured")
	}

	from := cfg.Email
	fromName := cfg.Name
	if fromName == "" {
		fromName = "NIATBAIK.ORG"
	}

	headers := map[string]string{
		"From":         fmt.Sprintf("%s <%s>", fromName, from),
		"To":           to,
		"Subject":      subject,
		"MIME-Version": "1.0",
		"Content-Type": "text/html; charset=\"UTF-8\"",
	}

	var msg strings.Builder
	for k, v := range headers {
		msg.WriteString(fmt.Sprintf("%s: %s\r\n", k, v))
	}
	msg.WriteString("\r\n")
	msg.WriteString(htmlBody)

	addr := fmt.Sprintf("%s:%d", cfg.Host, cfg.Port)
	auth := smtp.PlainAuth("", from, cfg.Password, cfg.Host)

	return smtp.SendMail(addr, auth, from, []string{to}, []byte(msg.String()))
}
