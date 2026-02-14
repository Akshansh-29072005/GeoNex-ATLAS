package otp

import (
	"backend/pkg/common/db"
	"context"
	"crypto/rand"
	"fmt"
	"io"
	"time"
)

type Service interface {
	GenerateOTP(identifier string) (string, error)
	VerifyOTP(identifier string, otp string) (bool, error)
}

type redisOTPService struct{}

func NewService() Service {
	return &redisOTPService{}
}

func (s *redisOTPService) GenerateOTP(identifier string) (string, error) {
	// Generate 6-digit secure OTP
	table := [...]byte{'1', '2', '3', '4', '5', '6', '7', '8', '9', '0'}
	otpEx := make([]byte, 6)
	n, err := io.ReadAtLeast(rand.Reader, otpEx, 6)
	if n != 6 || err != nil {
		return "", err
	}
	for i := 0; i < len(otpEx); i++ {
		otpEx[i] = table[int(otpEx[i])%len(table)]
	}
	otp := string(otpEx)

	// Store in Redis with 5 minute expiration
	// Key format: otp:{identifier} -> 123456
	key := fmt.Sprintf("otp:%s", identifier)

	if db.RDB == nil {
		return "", fmt.Errorf("redis not initialized")
	}

	err = db.RDB.Set(context.Background(), key, otp, 5*time.Minute).Err()
	if err != nil {
		return "", err
	}

	return otp, nil
}

func (s *redisOTPService) VerifyOTP(identifier string, otp string) (bool, error) {
	key := fmt.Sprintf("otp:%s", identifier)

	if db.RDB == nil {
		return false, fmt.Errorf("redis not initialized")
	}

	storedOTP, err := db.RDB.Get(context.Background(), key).Result()
	if err != nil {
		return false, nil // Not found or error = invalid otp
	}

	if storedOTP == otp {
		// Valid OTP, delete it to prevent reuse
		db.RDB.Del(context.Background(), key)
		return true, nil
	}

	return false, nil
}
