package notifications

import (
	"fmt"
	"log"
	"net/smtp"
	"os"
)

type Service interface {
	SendEmail(to []string, subject, body string) error
	SendViolationDetectedEmail(toEmail, ownerName, plotID, violationType, comparisonURL string) error
	SendOfficialNoticeEmail(toEmail, ownerName, plotID, violationType, noticeURL string) error
	SendStatusUpdateEmail(toEmail, ownerName, plotID, status string) error
}

type service struct{}

func NewService() Service {
	return &service{}
}

func (s *service) SendEmail(to []string, subject, body string) error {
	from := os.Getenv("SMTP_EMAIL")
	password := os.Getenv("SMTP_PASSWORD")
	host := os.Getenv("SMTP_HOST")
	port := os.Getenv("SMTP_PORT")

	if from == "" || password == "" {
		log.Println("SMTP credentials not set, skipping email")
		return nil
	}

	auth := smtp.PlainAuth("", from, password, host)
	msg := []byte("To: " + to[0] + "\r\n" +
		"Subject: " + subject + "\r\n" +
		"\r\n" +
		body + "\r\n")

	addr := fmt.Sprintf("%s:%s", host, port)
	err := smtp.SendMail(addr, auth, from, to, msg)
	if err != nil {
		log.Printf("Failed to send email: %v", err)
		return err
	}

	log.Printf("Email sent to %s", to[0])
	return nil
}

func (s *service) SendViolationDetectedEmail(toEmail, ownerName, plotID, violationType, comparisonURL string) error {
	subject := fmt.Sprintf("URGENT: Violation Detected on Plot %s", plotID)
	body := fmt.Sprintf("Dear %s,\n\nA potential violation (%s) has been detected on your plot %s by our satellite monitoring system.\n\nYou can view the analysis evidence here:\n%s\n\nPlease log in to the CSIDC Industry Portal to review the details and respond.\n\nRegards,\nCSIDC Monitoring Team", ownerName, violationType, plotID, comparisonURL)
	return s.SendEmail([]string{toEmail}, subject, body)
}

func (s *service) SendOfficialNoticeEmail(toEmail, ownerName, plotID, violationType, noticeURL string) error {
	subject := fmt.Sprintf("OFFICIAL NOTICE: Violation on Plot %s", plotID)
	body := fmt.Sprintf("Dear %s,\n\nThis is an official notice regarding the confirmed violation (%s) on your plot %s.\n\nPlease download the official notice here: %s\n\nImmediate action is required.\n\nRegards,\nCSIDC Authority", ownerName, violationType, plotID, noticeURL)
	return s.SendEmail([]string{toEmail}, subject, body)
}

func (s *service) SendStatusUpdateEmail(toEmail, ownerName, plotID, status string) error {
	subject := fmt.Sprintf("Update on Plot %s Violation", plotID)
	body := fmt.Sprintf("Dear %s,\n\nThe status of the violation on your plot %s has been updated to: %s.\n\nRegards,\nCSIDC Monitoring Team", ownerName, plotID, status)
	return s.SendEmail([]string{toEmail}, subject, body)
}
