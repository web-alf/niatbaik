package mailer

import (
	"crypto/tls"
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

// stripHeaderValue removes CR/LF so attacker-controlled values (recipient address,
// subject) can't inject extra SMTP headers or a body (email header injection).
func stripHeaderValue(s string) string {
	s = strings.ReplaceAll(s, "\r", "")
	s = strings.ReplaceAll(s, "\n", "")
	return s
}

// Send delivers an HTML email via SMTP. Credentials are sent only after STARTTLS
// is successfully negotiated; if the server doesn't support STARTTLS, Send fails
// rather than leaking the password over plaintext.
func Send(cfg Config, to, subject, htmlBody string) error {
	if cfg.Host == "" || cfg.Email == "" || cfg.Password == "" || cfg.Port == 0 {
		return fmt.Errorf("smtp not configured")
	}

	from := cfg.Email
	fromName := cfg.Name
	if fromName == "" {
		fromName = "NIATBAIK.ORG"
	}

	// Sanitize all header values that derive from user/runtime input.
	to = stripHeaderValue(to)
	subject = stripHeaderValue(subject)
	fromName = stripHeaderValue(fromName)
	if to == "" {
		return fmt.Errorf("invalid recipient")
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
	return sendSecure(addr, cfg.Host, cfg.Port, from, cfg.Password, to, msg.String())
}

// sendSecure delivers the message over an encrypted SMTP connection. Port 465 uses
// implicit TLS (TLS from the first byte); all other ports use explicit STARTTLS and
// REFUSE to continue if the server doesn't offer it — credentials are never sent in
// plaintext. This is stricter than smtp.SendMail, which would auth in the clear if
// STARTTLS were unavailable.
func sendSecure(addr, host string, port int, from, password, to, body string) error {
	var c *smtp.Client
	var err error

	if port == 465 {
		// Implicit TLS: dial straight into a TLS connection.
		conn, derr := tls.Dial("tcp", addr, &tls.Config{ServerName: host})
		if derr != nil {
			return derr
		}
		c, err = smtp.NewClient(conn, host)
		if err != nil {
			return err
		}
	} else {
		c, err = smtp.Dial(addr)
		if err != nil {
			return err
		}
		if ok, _ := c.Extension("STARTTLS"); !ok {
			c.Close()
			return fmt.Errorf("smtp server does not support STARTTLS; refusing to send credentials in plaintext")
		}
		if err := c.StartTLS(&tls.Config{ServerName: host}); err != nil {
			c.Close()
			return err
		}
	}
	defer c.Close()

	auth := smtp.PlainAuth("", from, password, host)
	if ok, _ := c.Extension("AUTH"); ok {
		if err := c.Auth(auth); err != nil {
			return err
		}
	}

	if err := c.Mail(from); err != nil {
		return err
	}
	if err := c.Rcpt(to); err != nil {
		return err
	}

	w, err := c.Data()
	if err != nil {
		return err
	}
	if _, err := w.Write([]byte(body)); err != nil {
		return err
	}
	if err := w.Close(); err != nil {
		return err
	}

	return c.Quit()
}
