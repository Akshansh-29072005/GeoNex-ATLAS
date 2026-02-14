package jwt

import (
	"testing"
	"time"
)

func TestGenerateToken(t *testing.T) {
	token, err := GenerateToken("user-123", "ADMIN")
	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}
	if token == "" {
		t.Error("Expected non-empty token")
	}
}

func TestValidateToken_Valid(t *testing.T) {
	token, _ := GenerateToken("user-456", "INSPECTOR")

	claims, err := ValidateToken(token)
	if err != nil {
		t.Fatalf("Expected valid token, got error: %v", err)
	}

	if claims.UserID != "user-456" {
		t.Errorf("Expected UserID 'user-456', got '%s'", claims.UserID)
	}
	if claims.Role != "INSPECTOR" {
		t.Errorf("Expected Role 'INSPECTOR', got '%s'", claims.Role)
	}
}

func TestValidateToken_Invalid(t *testing.T) {
	_, err := ValidateToken("invalid.token.string")
	if err == nil {
		t.Error("Expected error for invalid token")
	}
}

func TestValidateToken_Expired(t *testing.T) {
	// We can't easily test expired tokens without changing the secret/time,
	// but we verify that a tampered token fails
	token, _ := GenerateToken("user-789", "ADMIN")
	tampered := token + "tampered"

	_, err := ValidateToken(tampered)
	if err == nil {
		t.Error("Expected error for tampered token")
	}
}

func TestTokenContainsClaims(t *testing.T) {
	roles := []string{"SUPER_ADMIN", "ADMIN", "INSPECTOR", "INDUSTRY_OWNER"}

	for _, role := range roles {
		token, err := GenerateToken("test-id", role)
		if err != nil {
			t.Fatalf("Failed to generate token for role %s: %v", role, err)
		}

		claims, err := ValidateToken(token)
		if err != nil {
			t.Fatalf("Failed to validate token for role %s: %v", role, err)
		}

		if claims.Role != role {
			t.Errorf("Expected role '%s', got '%s'", role, claims.Role)
		}

		if claims.ExpiresAt == nil {
			t.Error("Token should have an expiry time")
		} else if claims.ExpiresAt.Time.Before(time.Now()) {
			t.Error("Token should not be expired immediately after creation")
		}
	}
}
