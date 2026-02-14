package allotments

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ApplicationStatus string

const (
	StatusPending  ApplicationStatus = "PENDING"
	StatusReview   ApplicationStatus = "REVIEW"
	StatusApproved ApplicationStatus = "APPROVED"
	StatusRejected ApplicationStatus = "REJECTED"
)

type Allotment struct {
	ID               uuid.UUID         `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	OwnerID          uuid.UUID         `gorm:"type:uuid;not null" json:"owner_id"`
	PlotID           string            `gorm:"not null" json:"plot_id"`
	Status           ApplicationStatus `gorm:"default:'PENDING'" json:"status"`
	DocumentsJSON    string            `gorm:"type:text" json:"documents_json"`    // Comma-separated or JSON
	ApplicantDetails string            `gorm:"type:text" json:"applicant_details"` // Name, Phone, ID Proofs JSON
	ReviewNotes      string            `json:"review_notes"`

	// Advanced Monitoring Fields
	AllotmentDate      *time.Time `json:"allotment_date"`
	ProductionStatus   string     `json:"production_status" gorm:"default:'NOT_STARTED'"` // NOT_STARTED, CONSTRUCTION, OPERATIONAL
	ProjectCost        float64    `json:"project_cost"`
	RevenueGenerated   float64    `json:"revenue_generated"`
	ProductionDeadline *time.Time `json:"production_deadline"` // AllotmentDate + 2 Years

	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

type ElectricityBill struct {
	ID            uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	AllotmentID   uuid.UUID `gorm:"type:uuid;not null" json:"allotment_id"`
	Month         string    `json:"month"` // "January", "February" etc
	Year          int       `json:"year"`
	Amount        float64   `json:"amount"`
	UnitsConsumed float64   `json:"units_consumed"`
	DocumentURL   string    `json:"document_url"`
	Status        string    `json:"status" gorm:"default:'PENDING'"` // PENDING, VERIFIED
	CreatedAt     time.Time `json:"created_at"`
}

type UploadBillRequest struct {
	AllotmentID   string  `json:"allotment_id" binding:"required"`
	Month         string  `json:"month" binding:"required"`
	Year          int     `json:"year" binding:"required"`
	Amount        float64 `json:"amount" binding:"required"`
	UnitsConsumed float64 `json:"units_consumed" binding:"required"`
	DocumentURL   string  `json:"document_url" binding:"required"`
}

type CreateApplicationRequest struct {
	PlotID           string `json:"plot_id" binding:"required"`
	DocumentsJSON    string `json:"documents_json"`
	ApplicantDetails string `json:"applicant_details"`
}

type UpdateStatusRequest struct {
	Status      ApplicationStatus `json:"status" binding:"required"`
	ReviewNotes string            `json:"review_notes"`
}
