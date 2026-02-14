package violations

import (
	"backend/pkg/auth"
	"backend/pkg/notifications"
	"backend/pkg/plots"
	"fmt"

	"github.com/google/uuid"
)

type Service interface {
	CreateViolation(req CreateViolationRequest) (*Violation, error)
	GetAllViolations() ([]Violation, error)
	GetViolationsByPlot(plotID string) ([]Violation, error)
	UpdateStatus(id uuid.UUID, status string) error

	AssignOfficer(violationID, officerID uuid.UUID) error
	GenerateNotice(violationID uuid.UUID) error
	VerifyViolation(violationID uuid.UUID) error
	CloseCase(violationID uuid.UUID) error
}

type service struct {
	repo         Repository
	plotRepo     plots.Repository
	userRepo     auth.Repository
	notification notifications.Service
}

func NewService(repo Repository, plotRepo plots.Repository, userRepo auth.Repository, notif notifications.Service) Service {
	return &service{
		repo:         repo,
		plotRepo:     plotRepo,
		userRepo:     userRepo,
		notification: notif,
	}
}

func (s *service) CreateViolation(req CreateViolationRequest) (*Violation, error) {
	v := &Violation{
		PlotID:             req.PlotID,
		Type:               req.Type,
		Status:             "DETECTED",
		Severity:           req.Severity,
		Description:        req.Description,
		ConfidenceScore:    req.ConfidenceScore,
		ImageBeforeURL:     req.ImageBeforeURL,
		ImageAfterURL:      req.ImageAfterURL,
		ComparisonImageURL: req.ComparisonImageURL,
	}

	if err := s.repo.Create(v); err != nil {
		return nil, err
	}

	// Update Plot Status to SUSPECTED (Yellow on Map)
	// User Requirement: "if the system founds it suspicious the color should become yelloe"
	if err := s.plotRepo.UpdateStatus(v.PlotID, "SUSPECTED"); err != nil {
		fmt.Printf("Failed to update plot status to SUSPECTED: %v\n", err)
	}

	// Notify Owner
	go s.notifyOwner(v.PlotID, "DETECTED", v.Type, v.ComparisonImageURL)

	return v, nil
}

func (s *service) GetAllViolations() ([]Violation, error) {
	return s.repo.FindAll()
}

func (s *service) GetViolationsByPlot(plotID string) ([]Violation, error) {
	return s.repo.FindByPlotID(plotID)
}

func (s *service) UpdateStatus(id uuid.UUID, status string) error {
	v, err := s.repo.FindByID(id)
	if err != nil {
		return err
	}

	if err := s.repo.UpdateStatus(id, status); err != nil {
		return err
	}

	// Sync Plot Status based on Violation Status
	var plotStatus string
	switch status {
	case "VERIFIED":
		plotStatus = "VIOLATION" // Red on Map
	case "RESOLVED", "CLOSED":
		plotStatus = "COMPLIANT" // Revert to Blue/Green
	default:
		// Keep as is or handle other states
	}

	if plotStatus != "" {
		if err := s.plotRepo.UpdateStatus(v.PlotID, plotStatus); err != nil {
			fmt.Printf("Failed to update plot status to %s: %v\n", plotStatus, err)
		}
	}

	go s.notifyOwner(v.PlotID, status, v.Type, "")
	return nil
}

func (s *service) AssignOfficer(violationID, officerID uuid.UUID) error {
	// Simple update for now, in real world check if officer exists
	// return s.repo.UpdateAssignedTo(violationID, officerID)
	// For MVP, we can treat this as a metadata update or implement specific repo method
	// Assuming Repository has Update method or we enable GORM updates generically
	return s.repo.UpdateStatus(violationID, "FIELD_VISIT_SCHEDULED")
}

func (s *service) GenerateNotice(violationID uuid.UUID) error {
	v, err := s.repo.FindByID(violationID)
	if err != nil {
		return err
	}

	if err := s.repo.UpdateStatus(violationID, "NOTICE_SENT"); err != nil {
		return err
	}

	// Generate PDF URL (Mocked or Real link)
	reportURL := fmt.Sprintf("http://localhost:8080/reports/violation/%s/pdf", violationID.String())
	go s.notifyOwner(v.PlotID, "NOTICE_SENT", v.Type, reportURL)

	return nil
}

func (s *service) VerifyViolation(violationID uuid.UUID) error {
	// UpdateStatus handles plot sync
	return s.UpdateStatus(violationID, "VERIFIED")
}

func (s *service) CloseCase(violationID uuid.UUID) error {
	// UpdateStatus handles plot sync
	return s.UpdateStatus(violationID, "RESOLVED")
}

// Helper to find owner email and send notification
func (s *service) notifyOwner(plotID, status, vType, extraURL string) {
	// 1. Get Plot
	plot, err := s.plotRepo.FindByID(plotID)
	if err != nil {
		return
	}

	// 2. Get Owner
	owner, err := s.userRepo.FindByID(plot.OwnerID)
	if err != nil || owner.Email == nil {
		return
	}

	// 3. Send Email
	switch status {
	case "DETECTED":
		s.notification.SendViolationDetectedEmail(*owner.Email, owner.Name, plotID, vType, extraURL)
	case "NOTICE_SENT":
		s.notification.SendOfficialNoticeEmail(*owner.Email, owner.Name, plotID, vType, extraURL)
	default:
		s.notification.SendStatusUpdateEmail(*owner.Email, owner.Name, plotID, status)
	}
}
