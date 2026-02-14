package main

import (
	"backend/pkg/common/email"
	"backend/pkg/common/sms"
	"fmt"
	"log"
	"os"

	"github.com/joho/godotenv"
)

func main() {
	// Load .env
	if err := godotenv.Load("../../.env"); err != nil {
		log.Println("⚠️  Warning: .env file not found, relying on system env vars")
	}

	emailAddr := "akshanshkhairwar2@gmail.com"
	phoneNum := "+918982600775" // Assuming +91

	fmt.Printf("🚀 Starting Notification Test...\n")
	fmt.Printf("📧 Target Email: %s\n", emailAddr)
	fmt.Printf("📱 Target Phone: %s\n", phoneNum)

	// 1. Test Email
	emailService := email.NewGmailService()
	fmt.Println("\nAttempting to send Email...")
	err := emailService.SendEmail(
		[]string{emailAddr},
		"CSIDC Notification Test",
		"<h1>Test Notification</h1><p>This is a test email from the CSIDC Land Compliance Platform.</p><p>If you see this, the Email Service is working!</p>",
	)
	if err != nil {
		fmt.Printf("❌ Email Failed: %v\n", err)
	} else {
		fmt.Printf("✅ Email Sent Successfully!\n")
	}

	// 2. Test SMS
	smsService := sms.NewTwilioService()
	fmt.Println("\nAttempting to send SMS...")
	if os.Getenv("TWILIO_ACCOUNT_SID") == "" {
		fmt.Println("⚠️  Twilio credentials missing. Skipping SMS test.")
	} else {
		err = smsService.SendSMS(phoneNum, "CSIDC Test: This is a test SMS from the Land Compliance Platform.")
		if err != nil {
			fmt.Printf("❌ SMS Failed: %v\n", err)
		} else {
			fmt.Printf("✅ SMS Sent Successfully!\n")
		}
	}

	fmt.Println("\nTest Complete.")
}
