package auth

import (
	"backend/pkg/common/email"
	"backend/pkg/common/jwt"
	"backend/pkg/common/otp"
	"backend/pkg/common/sms"
	"errors"
	"fmt"

	"golang.org/x/crypto/bcrypt"
)

type Service interface {
	Register(req RegisterRequest) (*LoginResponse, error)
	Login(req LoginRequest) (*LoginResponse, error)
	VerifyOTP(req VerifyOTPRequest) (*LoginResponse, error)
	GetAllUsers() ([]User, error)
}

type service struct {
	repo         Repository
	emailService email.Service
	smsService   sms.Service
	otpService   otp.Service
}

func NewService(repo Repository) Service {
	return &service{
		repo:         repo,
		emailService: email.NewGmailService(),
		smsService:   sms.NewTwilioService(),
		otpService:   otp.NewService(),
	}
}

func (s *service) Register(req RegisterRequest) (*LoginResponse, error) {
	// Hash Password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	user := &User{
		Name:     req.Name,
		Email:    req.Email,
		Password: string(hashedPassword),
		Role:     req.Role,
	}

	// Admin Registration Security Check
	if req.Role == RoleAdmin || req.Role == RoleSuperAdmin {
		expectedSecret := "admin123" // In production, use os.Getenv("ADMIN_SECRET")
		if req.AdminSecret != expectedSecret {
			return nil, errors.New("invalid admin secret key")
		}
	}

	if err := s.repo.CreateUser(user); err != nil {
		return nil, err
	}

	// Generate and Send OTP
	return s.sendOTP(user)
}

func (s *service) Login(req LoginRequest) (*LoginResponse, error) {
	var user *User
	var err error

	if req.Email != nil {
		user, err = s.repo.FindByEmail(*req.Email)
	} else if req.Phone != nil {
		user, err = s.repo.FindByPhone(*req.Phone)
	} else {
		return nil, errors.New("must provide email or phone")
	}

	if err != nil {
		return nil, errors.New("invalid credentials")
	}

	// Compare Password
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		return nil, errors.New("invalid credentials")
	}

	// BYPASS OTP FOR SUPER_ADMIN (Automated Systems)
	if user.Role == RoleSuperAdmin {
		token, err := jwt.GenerateToken(user.ID.String(), user.Role)
		if err != nil {
			return nil, err
		}
		return &LoginResponse{
			Token: token,
			User:  *user,
		}, nil
	}

	// Generate and Send OTP
	return s.sendOTP(user)
}

func (s *service) sendOTP(user *User) (*LoginResponse, error) {
	var identifier string
	if user.Email != nil {
		identifier = *user.Email
	} else if user.Phone != nil {
		identifier = *user.Phone
	} else {
		return nil, errors.New("user has no email or phone")
	}

	otpCode, err := s.otpService.GenerateOTP(identifier)
	if err != nil {
		return nil, fmt.Errorf("failed to generate otp: %v", err)
	}

	// Send OTP asynchronously
	go func() {
		msg := fmt.Sprintf("Your OTP for GeoNex ATLAS Land Compliance Platform is: %s", otpCode)
		if user.Email != nil {
			s.emailService.SendEmail([]string{*user.Email}, "Your GeoNex ATLAS Login OTP", fmt.Sprintf("<h1>Your OTP is: %s</h1>", otpCode))
		}
		if user.Phone != nil {
			s.smsService.SendSMS(*user.Phone, msg)
		}
	}()

	return &LoginResponse{
		User:        *user,
		OTPRequired: true,
	}, nil
}

func (s *service) VerifyOTP(req VerifyOTPRequest) (*LoginResponse, error) {
	var identifier string
	var user *User
	var err error

	if req.Email != "" {
		identifier = req.Email
		user, err = s.repo.FindByEmail(req.Email)
	} else if req.Phone != "" {
		identifier = req.Phone
		user, err = s.repo.FindByPhone(req.Phone)
	} else {
		return nil, errors.New("must provide email or phone")
	}

	if err != nil {
		return nil, errors.New("user not found")
	}

	valid, err := s.otpService.VerifyOTP(identifier, req.OTP)
	if err != nil {
		return nil, fmt.Errorf("otp verification failed: %v", err)
	}
	if !valid {
		return nil, errors.New("invalid or expired otp")
	}

	// Generate Token
	token, err := jwt.GenerateToken(user.ID.String(), user.Role)
	if err != nil {
		return nil, err
	}

	return &LoginResponse{
		Token: token,
		User:  *user,
	}, nil
}

func (s *service) GetAllUsers() ([]User, error) {
	return s.repo.FindAll()
}
