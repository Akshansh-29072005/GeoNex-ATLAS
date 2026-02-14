package auth

import (
	"errors"
	"testing"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

// ============================================
// MOCK REPOSITORY
// ============================================

type mockRepository struct {
	users map[string]*User // keyed by email
}

func newMockRepo() *mockRepository {
	return &mockRepository{users: make(map[string]*User)}
}

func (m *mockRepository) CreateUser(user *User) error {
	if user.Email != nil {
		if _, exists := m.users[*user.Email]; exists {
			return errors.New("email already exists")
		}
		m.users[*user.Email] = user
	}
	if user.Phone != nil {
		if _, exists := m.users[*user.Phone]; exists {
			return errors.New("phone already exists")
		}
		m.users[*user.Phone] = user
	}
	user.ID = uuid.New()
	return nil
}

func (m *mockRepository) FindByEmail(email string) (*User, error) {
	user, exists := m.users[email]
	if !exists {
		return nil, errors.New("not found")
	}
	return user, nil
}

func (m *mockRepository) FindByPhone(phone string) (*User, error) {
	user, exists := m.users[phone]
	if !exists {
		return nil, errors.New("not found")
	}
	return user, nil
}

func (m *mockRepository) FindByID(id uuid.UUID) (*User, error) {
	for _, user := range m.users {
		if user.ID == id {
			return user, nil
		}
	}
	return nil, errors.New("not found")
}

func (m *mockRepository) FindAll() ([]User, error) {
	var users []User
	for _, user := range m.users {
		users = append(users, *user)
	}
	return users, nil
}

// ============================================
// TESTS
// ============================================

// ============================================
// MOCK SERVICES
// ============================================

type mockEmailService struct{}

func (m *mockEmailService) SendEmail(to []string, subject, body string) error {
	return nil
}

type mockSMSService struct{}

func (m *mockSMSService) SendSMS(to string, body string) error {
	return nil
}

type mockOTPService struct{}

func (m *mockOTPService) GenerateOTP(identifier string) (string, error) {
	return "123456", nil
}

func (m *mockOTPService) VerifyOTP(identifier string, otp string) (bool, error) {
	if otp == "123456" {
		return true, nil
	}
	return false, nil
}

// ============================================
// TESTS
// ============================================

func newTestService(repo Repository) Service {
	return &service{
		repo:         repo,
		emailService: &mockEmailService{},
		smsService:   &mockSMSService{},
		otpService:   &mockOTPService{},
	}
}

func TestRegister_WithEmail(t *testing.T) {
	repo := newMockRepo()
	svc := newTestService(repo)

	email := "test@csidc.gov.in"
	req := RegisterRequest{
		Name:     "Test User",
		Email:    &email,
		Password: "password123",
		Role:     RoleInspector,
	}

	resp, err := svc.Register(req)
	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}

	if resp.User.Name != "Test User" {
		t.Errorf("Expected name 'Test User', got '%s'", resp.User.Name)
	}
	if resp.User.Role != RoleInspector {
		t.Errorf("Expected role '%s', got '%s'", RoleInspector, resp.User.Role)
	}
	// Password should be hashed, not plaintext
	if resp.User.Password == "password123" {
		t.Error("Password should be hashed, not stored as plaintext")
	}
	if !resp.OTPRequired {
		t.Error("Expected OTPRequired to be true")
	}
}

func TestRegister_WithPhone(t *testing.T) {
	repo := newMockRepo()
	svc := newTestService(repo)

	phone := "+919876543210"
	req := RegisterRequest{
		Name:     "Industry Owner",
		Phone:    &phone,
		Password: "securepass",
		Role:     RoleIndustryOwner,
	}

	resp, err := svc.Register(req)
	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}

	if resp.User.Role != RoleIndustryOwner {
		t.Errorf("Expected role '%s', got '%s'", RoleIndustryOwner, resp.User.Role)
	}
}

func TestRegister_DuplicateEmail(t *testing.T) {
	repo := newMockRepo()
	svc := newTestService(repo)

	email := "dup@csidc.gov.in"
	req := RegisterRequest{
		Name:     "User 1",
		Email:    &email,
		Password: "password123",
		Role:     RoleAdmin,
	}

	_, err := svc.Register(req)
	if err != nil {
		t.Fatalf("First register should succeed, got %v", err)
	}

	_, err = svc.Register(req)
	if err == nil {
		t.Error("Expected error for duplicate email, got nil")
	}
}

func TestLogin_WithEmail_Success(t *testing.T) {
	repo := newMockRepo()
	svc := newTestService(repo)

	email := "login@csidc.gov.in"
	// Register first
	regReq := RegisterRequest{
		Name:     "Login User",
		Email:    &email,
		Password: "mypassword",
		Role:     RoleAdmin,
	}
	_, err := svc.Register(regReq)
	if err != nil {
		t.Fatalf("Register failed: %v", err)
	}

	// Now login
	loginReq := LoginRequest{
		Email:    &email,
		Password: "mypassword",
	}
	resp, err := svc.Login(loginReq)
	if err != nil {
		t.Fatalf("Login should succeed, got %v", err)
	}

	// Should NOT return token immediately, but require OTP
	if resp.Token != "" {
		t.Error("Expected empty token (OTP required), got token")
	}
	if !resp.OTPRequired {
		t.Error("Expected OTPRequired to be true")
	}
	if resp.User.Name != "Login User" {
		t.Errorf("Expected user name 'Login User', got '%s'", resp.User.Name)
	}
}

func TestLogin_WrongPassword(t *testing.T) {
	repo := newMockRepo()
	svc := newTestService(repo)

	email := "wrong@csidc.gov.in"
	regReq := RegisterRequest{
		Name:     "Wrong Pass",
		Email:    &email,
		Password: "correctpass",
		Role:     RoleInspector,
	}
	_, _ = svc.Register(regReq)

	loginReq := LoginRequest{
		Email:    &email,
		Password: "wrongpass",
	}
	_, err := svc.Login(loginReq)
	if err == nil {
		t.Error("Expected error for wrong password, got nil")
	}
}

func TestLogin_NoCredentials(t *testing.T) {
	repo := newMockRepo()
	svc := newTestService(repo)

	loginReq := LoginRequest{
		Password: "somepass",
	}
	_, err := svc.Login(loginReq)
	if err == nil {
		t.Error("Expected error when no email or phone provided")
	}
}

func TestLogin_NonExistentUser(t *testing.T) {
	repo := newMockRepo()
	svc := newTestService(repo)

	email := "nobody@csidc.gov.in"
	loginReq := LoginRequest{
		Email:    &email,
		Password: "somepass",
	}
	_, err := svc.Login(loginReq)
	if err == nil {
		t.Error("Expected error for non-existent user")
	}
}

func TestPasswordIsHashed(t *testing.T) {
	repo := newMockRepo()
	svc := newTestService(repo)

	email := "hash@csidc.gov.in"
	req := RegisterRequest{
		Name:     "Hash Test",
		Email:    &email,
		Password: "testpassword",
		Role:     RoleAdmin,
	}

	resp, err := svc.Register(req)
	if err != nil {
		t.Fatalf("Register failed: %v", err)
	}

	err = bcrypt.CompareHashAndPassword([]byte(resp.User.Password), []byte("testpassword"))
	if err != nil {
		t.Error("Password hash should be valid bcrypt hash")
	}
}
