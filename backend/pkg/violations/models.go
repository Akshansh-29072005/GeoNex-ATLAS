package violations

import (
	"backend/pkg/plots"
	"time"

	"github.com/google/uuid"
)

type Violation struct {
	ID                 uuid.UUID  `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	PlotID             string     `json:"plot_id"`
	Plot               plots.Plot `gorm:"foreignKey:PlotID" json:"plot"`
	Type               string     `json:"type"`   // ENCROACHMENT, GREEN_COVER, CONSTRUCTION
	Status             string     `json:"status"` // DETECTED, VERIFIED, NOTICE_SENT, RESOLVED
	Severity           string     `json:"severity"`
	Description        string     `json:"description"`
	ConfidenceScore    float64    `json:"confidence_score"`
	ImageBeforeURL     string     `json:"image_before_url"`
	ImageAfterURL      string     `json:"image_after_url"`
	ComparisonImageURL string     `json:"comparison_image_url"`
	DetectedAt         time.Time  `json:"detected_at"`

	AssignedTo *uuid.UUID `gorm:"type:uuid" json:"assigned_to"` // Inspector UUID
	// AssignedUser auth.User `gorm:"foreignKey:AssignedTo" json:"assigned_user"` // Avoid circular dependency if possible, or leave for query
}

type CreateViolationRequest struct {
	PlotID             string  `json:"plot_id" binding:"required"`
	Type               string  `json:"type" binding:"required"`
	Severity           string  `json:"severity"`
	Description        string  `json:"description"`
	ConfidenceScore    float64 `json:"confidence_score"`
	ImageBeforeURL     string  `json:"image_before_url"`
	ImageAfterURL      string  `json:"image_after_url"`
	ComparisonImageURL string  `json:"comparison_image_url"`
}

type UpdateViolationStatusRequest struct {
	Status string `json:"status" binding:"required"`
}

type AssignOfficerRequest struct {
	OfficerID string `json:"officer_id" binding:"required"`
}
