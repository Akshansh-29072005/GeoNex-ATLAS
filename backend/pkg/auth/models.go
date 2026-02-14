package auth

import (
	"time"

	"github.com/google/uuid"
)

// User Role Constants
const (
	RoleSuperAdmin    = "SUPER_ADMIN"
	RoleAdmin         = "ADMIN"
	RoleInspector     = "INSPECTOR"
	RoleIndustryOwner = "INDUSTRY_OWNER"
)

// User Model (Maps to 'users' table)
type User struct {
	ID        uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	Name      string    `gorm:"not null" json:"name"`
	Email     *string   `gorm:"unique" json:"email,omitempty"`
	Phone     *string   `gorm:"unique" json:"phone,omitempty"`
	Password  string    `gorm:"column:password_hash;not null" json:"-"`
	Role      string    `gorm:"not null" json:"role"`
	CreatedAt time.Time `json:"created_at"`
}

// Request DTOs
type RegisterRequest struct {
	Name        string  `json:"name" binding:"required"`
	Email       *string `json:"email"`
	Phone       *string `json:"phone"`
	Password    string  `json:"password" binding:"required,min=6"`
	Role        string  `json:"role" binding:"required"`
	AdminSecret string  `json:"admin_secret"`
}

type LoginRequest struct {
	Email    *string `json:"email"`
	Phone    *string `json:"phone"`
	Password string  `json:"password" binding:"required"`
}

type LoginResponse struct {
	Token       string `json:"token,omitempty"`
	User        User   `json:"user"`
	OTPRequired bool   `json:"otp_required"`
}

type VerifyOTPRequest struct {
	Email string `json:"email"`
	Phone string `json:"phone"`
	OTP   string `json:"otp" binding:"required"`
}
