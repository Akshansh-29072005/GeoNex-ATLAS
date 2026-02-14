package allotments

import (
	"backend/pkg/auth"
	"backend/pkg/common/email"
	"backend/pkg/plots"
	"fmt"
	"time"

	"github.com/google/uuid"
)

type Service interface {
	Apply(ownerID uuid.UUID, req CreateApplicationRequest) (*Allotment, error)
	GetMyApplications(ownerID uuid.UUID) ([]Allotment, error)
	GetAllApplications() ([]Allotment, error)
	UpdateStatus(id uuid.UUID, req UpdateStatusRequest) (*Allotment, error)
}

type service struct {
	repo         Repository
	userRepo     auth.Repository
	plotsRepo    plots.Repository
	emailService email.Service
}

func NewService(repo Repository, userRepo auth.Repository, plotsRepo plots.Repository, emailService email.Service) Service {
	return &service{
		repo:         repo,
		userRepo:     userRepo,
		plotsRepo:    plotsRepo,
		emailService: emailService,
	}
}

func (s *service) Apply(ownerID uuid.UUID, req CreateApplicationRequest) (*Allotment, error) {
	// 1. Create Application
	app := &Allotment{
		OwnerID:          ownerID,
		PlotID:           req.PlotID,
		Status:           StatusPending,
		DocumentsJSON:    req.DocumentsJSON,
		ApplicantDetails: req.ApplicantDetails,
	}

	if err := s.repo.Create(app); err != nil {
		return nil, err
	}

	// 2. Send Confirmation Email
	// We need user details
	user, err := s.userRepo.FindByID(ownerID)
	if err == nil && user.Email != nil {
		subject := "Land Allotment Application Received"
		body := fmt.Sprintf("<h1>Application Received</h1><p>Dear %s,</p><p>We have received your application for Plot <strong>%s</strong>.</p><p>Your Application ID is: %s</p><p>Status: <strong>PENDING</strong></p>", user.Name, app.PlotID, app.ID)
		go s.emailService.SendEmail([]string{*user.Email}, subject, body)
	}

	return app, nil
}

func (s *service) GetMyApplications(ownerID uuid.UUID) ([]Allotment, error) {
	return s.repo.GetByOwner(ownerID)
}

func (s *service) GetAllApplications() ([]Allotment, error) {
	return s.repo.GetAll()
}

func (s *service) UpdateStatus(id uuid.UUID, req UpdateStatusRequest) (*Allotment, error) {
	app, err := s.repo.GetByID(id)
	if err != nil {
		return nil, err // Not Found
	}

	oldStatus := app.Status
	if req.Status != "" {
		app.Status = req.Status
	}
	app.ReviewNotes = req.ReviewNotes

	// Logic for Approval: Start Monitoring Timer
	if req.Status == StatusApproved && oldStatus != StatusApproved {
		now := time.Now()
		deadline := now.AddDate(2, 0, 0) // 2 Years Deadline
		app.AllotmentDate = &now
		app.ProductionDeadline = &deadline
		app.ProductionStatus = "NOT_STARTED"

		// Update Plot Owner
		if err := s.plotsRepo.UpdateOwner(app.PlotID, app.OwnerID.String()); err != nil {
			fmt.Printf("Failed to update plot owner: %v\n", err)
			return nil, err
		}
		// Update Plot Status to ALLOTTED (if you want blue map)
		// But map logic says: if (!isSystemOwned) -> Blue. So Owner Update is sufficient.
	}

	if err := s.repo.Update(app); err != nil {
		return nil, err
	}

	// Send Email Notification on status change
	if oldStatus != app.Status {
		user, err := s.userRepo.FindByID(app.OwnerID)
		if err == nil && user.Email != nil {
			subject := fmt.Sprintf("Application Status Update: %s", app.Status)
			body := fmt.Sprintf("<h1>Status Update</h1><p>Dear %s,</p><p>The status of your application for Plot <strong>%s</strong> has been updated to <strong>%s</strong>.</p><p><strong>Review Notes:</strong> %s</p>", user.Name, app.PlotID, app.Status, app.ReviewNotes)
			go s.emailService.SendEmail([]string{*user.Email}, subject, body)
		}
	}

	return app, nil
}
