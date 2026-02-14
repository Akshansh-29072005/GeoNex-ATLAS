package reports

import (
	"backend/pkg/auth"
	"backend/pkg/plots"
	"backend/pkg/violations"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Service interface {
	GetComplianceStats() (*ComplianceStats, error)
	GetComplianceChecklist() ([]ComplianceItem, error)
	GetViolationReport(violationID uuid.UUID) ([]byte, error)
}

type service struct {
	db         *gorm.DB
	userRepo   auth.Repository
	pdfService PDFService
}

func NewService(db *gorm.DB, userRepo auth.Repository) Service {
	return &service{
		db:         db,
		userRepo:   userRepo,
		pdfService: NewPDFService(),
	}
}

func (s *service) GetComplianceStats() (*ComplianceStats, error) {
	var total, compliant int64
	var violationsList []violations.Violation

	// Total Plots (Checks)
	if err := s.db.Model(&plots.Plot{}).Count(&total).Error; err != nil {
		return nil, err
	}

	// Compliant Units
	if err := s.db.Model(&plots.Plot{}).Where("status = ?", "COMPLIANT").Count(&compliant).Error; err != nil {
		return nil, err
	}

	// Fetch active violations to calculate overdue/near deadline
	if err := s.db.Where("status != ?", "RESOLVED").Find(&violationsList).Error; err != nil {
		return nil, err
	}

	var nearDeadline, overdue int64
	violationByType := make(map[string]int64)

	for _, v := range violationsList {
		// Mock Logic: Deadline is 30 days after detection
		deadline := v.DetectedAt.AddDate(0, 0, 30)
		daysLeft := int(time.Until(deadline).Hours() / 24)

		if daysLeft < 0 {
			overdue++
		} else if daysLeft <= 7 {
			nearDeadline++
		}

		// Count by Type
		vType := v.Type
		if vType == "" {
			vType = "Unknown"
		}
		violationByType[vType]++
	}

	return &ComplianceStats{
		TotalChecks:     total,
		CompliantUnits:  compliant,
		NearDeadline:    nearDeadline,
		OverdueChecks:   overdue,
		ViolationByType: violationByType,
	}, nil
}

func (s *service) GetComplianceChecklist() ([]ComplianceItem, error) {
	var allPlots []plots.Plot
	if err := s.db.Find(&allPlots).Error; err != nil {
		return nil, err
	}

	var checklist []ComplianceItem

	for _, p := range allPlots {
		// 1. Fetch Owner (Company)
		ownerName := "Unknown"
		if p.OwnerID.String() != "" { // Check if valid UUID
			user, err := s.userRepo.FindByID(p.OwnerID)
			if err == nil && user != nil {
				ownerName = user.Name
			}
		}

		// 2. Check for Violations
		var activeViolation violations.Violation
		err := s.db.Where("plot_id = ? AND status != ?", p.ID, "RESOLVED").First(&activeViolation).Error

		status := "Compliant"
		risk := "Low"
		score := 100
		deadlineDate := time.Now().AddDate(0, 0, 30) // Default future deadline

		if err == nil { // Violation found
			// Violation Logic
			status = "Non-Compliant"
			deadline := activeViolation.DetectedAt.AddDate(0, 0, 30)
			deadlineDate = deadline
			daysLeft := int(time.Until(deadline).Hours() / 24)

			if daysLeft < 0 {
				status = "Overdue"
				risk = "High"
				score = 0
			} else if daysLeft <= 7 {
				status = "Near Deadline"
				risk = "Medium"
				score = 50
			} else {
				risk = "Low"
				score = 75
			}

			// Adjust Risk based on Severity
			if activeViolation.Severity == "HIGH" {
				risk = "High"
				score = 25
			}
		} else {
			// No violation found
			risk = "Compliance" // UI expects specific strings maybe? Using "Quality & Safety" from mock?
			// Mapping to UI logic:
			// If compliant, Risk Factor field acts as "Compliance Category" e.g. "Environmental", "Financial"
			// For now, let's just stick to "Low" risk for compliant.
		}

		daysLeft := int(time.Until(deadlineDate).Hours() / 24)
		if status == "Compliant" {
			daysLeft = 365 // arbitrary large number
		}

		item := ComplianceItem{
			PlotID:          p.ID,
			OwnerName:       ownerName,
			RiskFactor:      risk, // Or "Environmental", "Safety" randomized if compliant
			ComplianceScore: score,
			Deadline:        deadlineDate.Format("Jan 02, 2006"),
			DaysLeft:        daysLeft,
			Status:          status,
			LastInspected:   p.CreatedAt,
			ViolationType:   activeViolation.Type,
			ViolationDesc:   activeViolation.Description,
			ReportedBy:      "Satellite (Sentinel-2)", // Default for automated system
		}

		if status == "Compliant" {
			item.ViolationType = ""
			item.ViolationDesc = "No violations detected."
			item.ReportedBy = "System Safe"
		}

		checklist = append(checklist, item)
	}

	return checklist, nil
}

func (s *service) GetViolationReport(violationID uuid.UUID) ([]byte, error) {
	// 1. Fetch Violation
	var v violations.Violation
	if err := s.db.First(&v, "id = ?", violationID).Error; err != nil {
		return nil, err
	}

	// 2. Fetch Plot
	var p plots.Plot
	if err := s.db.First(&p, "id = ?", v.PlotID).Error; err != nil {
		return nil, err
	}

	// 3. Fetch Owner
	ownerName := "Unknown"
	if p.OwnerID != uuid.Nil {
		user, err := s.userRepo.FindByID(p.OwnerID)
		if err == nil && user != nil {
			ownerName = user.Name
		}
	}

	// 4. Generate PDF
	return s.pdfService.GenerateViolationReport(&v, &p, ownerName)
}
