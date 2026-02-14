package sms

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"os"
	"strings"
)

type Service interface {
	SendSMS(to string, body string) error
}

type twilioService struct {
	accountSID string
	authToken  string
	fromPhone  string
}

func NewTwilioService() Service {
	return &twilioService{
		accountSID: os.Getenv("TWILIO_ACCOUNT_SID"),
		authToken:  os.Getenv("TWILIO_AUTH_TOKEN"),
		fromPhone:  os.Getenv("TWILIO_FROM_PHONE"),
	}
}

func (s *twilioService) SendSMS(to string, body string) error {
	if s.accountSID == "" || s.authToken == "" {
		fmt.Println("⚠️  Twilio not configured (skipping SMS)")
		return nil
	}

	apiURL := fmt.Sprintf("https://api.twilio.com/2010-04-01/Accounts/%s/Messages.json", s.accountSID)

	data := url.Values{}
	data.Set("To", to)
	data.Set("From", s.fromPhone)
	data.Set("Body", body)

	req, _ := http.NewRequest("POST", apiURL, strings.NewReader(data.Encode()))
	req.SetBasicAuth(s.accountSID, s.authToken)
	req.Header.Add("Content-Type", "application/x-www-form-urlencoded")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send SMS: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 200 && resp.StatusCode < 300 {
		return nil
	}

	var errorResp map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&errorResp)
	return fmt.Errorf("twilio error: %v", errorResp["message"])
}
