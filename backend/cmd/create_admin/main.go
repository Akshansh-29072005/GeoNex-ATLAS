package main

import (
	"backend/pkg/auth"
	"backend/pkg/common/db"
	"fmt"
	"log"

	"github.com/joho/godotenv"
	"golang.org/x/crypto/bcrypt"
)

func main() {
	// Load .env from root (assuming running from backend/cmd/create_admin or handled via shell)
	// Try multiple paths
	_ = godotenv.Load("../../../.env")
	_ = godotenv.Load("../../.env")
	_ = godotenv.Load(".env")

	// Connect DB
	db.ConnectInput()

	email := "admin@csidc.gov.in"
	password := "Admin@123"
	name := "System Administrator"

	// Hash Password
	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)

	user := &auth.User{
		Name:     name,
		Email:    &email,
		Password: string(hashedPassword),
		Role:     "ADMIN",
	}

	// Delete existing if any
	db.DB.Where("email = ?", email).Delete(&auth.User{})

	// Create
	if err := db.DB.Create(user).Error; err != nil {
		log.Fatalf("❌ Failed to create admin: %v", err)
	}

	fmt.Printf("✅ Admin Created Successfully!\n")
	fmt.Printf("📧 Email: %s\n", email)
	fmt.Printf("🔑 Password: %s\n", password)
	fmt.Printf("🛡️  Role: ADMIN\n")
}
