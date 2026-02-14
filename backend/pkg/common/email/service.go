package email

import (
	"fmt"
	"net/smtp"
	"os"
)

type Service interface {
	SendEmail(to []string, subject string, body string) error
}

type gmailService struct {
	from     string
	password string
	host     string
	port     string
}

func NewGmailService() Service {
	return &gmailService{
		from:     os.Getenv("SMTP_EMAIL"),
		password: os.Getenv("SMTP_PASSWORD"),
		host:     os.Getenv("SMTP_HOST"), // "smtp.gmail.com"
		port:     os.Getenv("SMTP_PORT"), // "587"
	}
}

func (s *gmailService) SendEmail(to []string, subject string, body string) error {
	if s.from == "" || s.password == "" {
		fmt.Println("⚠️  Email service not configured (skipping)")
		return nil
	}

	auth := smtp.PlainAuth("", s.from, s.password, s.host)

	// MIME headers for HTML email
	mime := "MIME-version: 1.0;\nContent-Type: text/html; charset=\"UTF-8\";\n\n"
	msg := []byte(fmt.Sprintf("To: %s\r\nSubject: %s\r\n%s\r\n%s", to[0], subject, mime, body))

	addr := fmt.Sprintf("%s:%s", s.host, s.port)

	if err := smtp.SendMail(addr, auth, s.from, to, msg); err != nil {
		return fmt.Errorf("failed to send email: %v", err)
	}

	return nil
}
