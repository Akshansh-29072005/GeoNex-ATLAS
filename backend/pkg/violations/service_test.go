package violations

import (
	"errors"
	"testing"

	"backend/pkg/auth"
	"backend/pkg/plots"

	"github.com/google/uuid"
)

// ============================================
// MOCK REPOSITORY
// ============================================

type mockRepository struct {
	violations map[uuid.UUID]*Violation
}

func newMockRepo() *mockRepository {
	return &mockRepository{violations: make(map[uuid.UUID]*Violation)}
}

func (m *mockRepository) Create(v *Violation) error {
	v.ID = uuid.New()
	m.violations[v.ID] = v
	return nil
}

func (m *mockRepository) FindAll() ([]Violation, error) {
	var result []Violation
	for _, v := range m.violations {
		result = append(result, *v)
	}
	return result, nil
}

func (m *mockRepository) FindByPlotID(plotID string) ([]Violation, error) {
	var result []Violation
	for _, v := range m.violations {
		if v.PlotID == plotID {
			result = append(result, *v)
		}
	}
	return result, nil
}

func (m *mockRepository) FindByID(id uuid.UUID) (*Violation, error) {
	v, exists := m.violations[id]
	if !exists {
		return nil, errors.New("not found")
	}
	return v, nil
}

func (m *mockRepository) UpdateStatus(id uuid.UUID, status string) error {
	v, exists := m.violations[id]
	if !exists {
		return errors.New("not found")
	}
	v.Status = status
	return nil
}

// Additional Mocks for Dependencies
type mockPlotsRepo struct{}

func (m *mockPlotsRepo) CreatePlot(p *plots.Plot, g string) error { return nil }
func (m *mockPlotsRepo) GetAllPlots() ([]plots.Plot, error)       { return nil, nil }
func (m *mockPlotsRepo) FindByID(id string) (*plots.Plot, error) {
	return &plots.Plot{ID: id, OwnerID: uuid.New(), LocationName: "Mock Loc"}, nil
}
func (m *mockPlotsRepo) UpdateOwner(id string, ownerID string) error { return nil }
func (m *mockPlotsRepo) UpdateStatus(id string, status string) error { return nil }

type mockAuthRepo struct{}

func (m *mockAuthRepo) CreateUser(u *auth.User) error            { return nil }
func (m *mockAuthRepo) FindByEmail(e string) (*auth.User, error) { return nil, nil }
func (m *mockAuthRepo) FindByPhone(p string) (*auth.User, error) { return nil, nil }
func (m *mockAuthRepo) FindByID(id uuid.UUID) (*auth.User, error) {
	email := "test@example.com"
	return &auth.User{ID: id, Name: "Test User", Email: &email}, nil
}
func (m *mockAuthRepo) FindAll() ([]auth.User, error) { return nil, nil }

type mockNotifService struct{}

func (m *mockNotifService) SendEmail(to []string, subject, body string) error { return nil }
func (m *mockNotifService) SendViolationDetectedEmail(to, name, plotID, vType, comparisonURL string) error {
	return nil
}
func (m *mockNotifService) SendOfficialNoticeEmail(to, name, plotID, vType, url string) error {
	return nil
}
func (m *mockNotifService) SendStatusUpdateEmail(to, name, plotID, status string) error { return nil }

// ============================================
// TESTS
// ============================================

func TestCreateViolation(t *testing.T) {
	repo := newMockRepo()
	svc := NewService(repo, &mockPlotsRepo{}, &mockAuthRepo{}, &mockNotifService{})

	req := CreateViolationRequest{
		PlotID:          "P-101",
		Type:            "ENCROACHMENT",
		ConfidenceScore: 92.5,
		ImageBeforeURL:  "https://example.com/before.png",
		ImageAfterURL:   "https://example.com/after.png",
	}

	v, err := svc.CreateViolation(req)
	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}

	if v.PlotID != "P-101" {
		t.Errorf("Expected PlotID 'P-101', got '%s'", v.PlotID)
	}
	if v.Status != "DETECTED" {
		t.Errorf("Expected initial status 'DETECTED', got '%s'", v.Status)
	}
	if v.Type != "ENCROACHMENT" {
		t.Errorf("Expected type 'ENCROACHMENT', got '%s'", v.Type)
	}
}

func TestCreateViolation_DefaultStatus(t *testing.T) {
	repo := newMockRepo()
	svc := NewService(repo, &mockPlotsRepo{}, &mockAuthRepo{}, &mockNotifService{})

	req := CreateViolationRequest{
		PlotID: "P-201",
		Type:   "GREEN_COVER",
	}

	v, err := svc.CreateViolation(req)
	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}

	if v.Status != "DETECTED" {
		t.Errorf("New violations should default to 'DETECTED', got '%s'", v.Status)
	}
}

func TestGetAllViolations(t *testing.T) {
	repo := newMockRepo()
	svc := NewService(repo, &mockPlotsRepo{}, &mockAuthRepo{}, &mockNotifService{})

	// Create multiple
	svc.CreateViolation(CreateViolationRequest{PlotID: "P-101", Type: "ENCROACHMENT"})
	svc.CreateViolation(CreateViolationRequest{PlotID: "P-102", Type: "GREEN_COVER"})
	svc.CreateViolation(CreateViolationRequest{PlotID: "P-103", Type: "CONSTRUCTION"})

	all, err := svc.GetAllViolations()
	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}

	if len(all) != 3 {
		t.Errorf("Expected 3 violations, got %d", len(all))
	}
}

func TestGetViolationsByPlot(t *testing.T) {
	repo := newMockRepo()
	svc := NewService(repo, &mockPlotsRepo{}, &mockAuthRepo{}, &mockNotifService{})

	svc.CreateViolation(CreateViolationRequest{PlotID: "P-101", Type: "ENCROACHMENT"})
	svc.CreateViolation(CreateViolationRequest{PlotID: "P-101", Type: "GREEN_COVER"})
	svc.CreateViolation(CreateViolationRequest{PlotID: "P-202", Type: "CONSTRUCTION"})

	plotViolations, err := svc.GetViolationsByPlot("P-101")
	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}

	if len(plotViolations) != 2 {
		t.Errorf("Expected 2 violations for P-101, got %d", len(plotViolations))
	}
}

func TestUpdateStatus_Lifecycle(t *testing.T) {
	repo := newMockRepo()
	svc := NewService(repo, &mockPlotsRepo{}, &mockAuthRepo{}, &mockNotifService{})

	v, _ := svc.CreateViolation(CreateViolationRequest{PlotID: "P-301", Type: "ENCROACHMENT"})

	// DETECTED -> VERIFIED
	if err := svc.UpdateStatus(v.ID, "VERIFIED"); err != nil {
		t.Fatalf("Update to VERIFIED failed: %v", err)
	}
	if repo.violations[v.ID].Status != "VERIFIED" {
		t.Error("Status should be VERIFIED")
	}

	// VERIFIED -> NOTICE_SENT
	if err := svc.UpdateStatus(v.ID, "NOTICE_SENT"); err != nil {
		t.Fatalf("Update to NOTICE_SENT failed: %v", err)
	}
	if repo.violations[v.ID].Status != "NOTICE_SENT" {
		t.Error("Status should be NOTICE_SENT")
	}

	// NOTICE_SENT -> RESOLVED
	if err := svc.UpdateStatus(v.ID, "RESOLVED"); err != nil {
		t.Fatalf("Update to RESOLVED failed: %v", err)
	}
	if repo.violations[v.ID].Status != "RESOLVED" {
		t.Error("Status should be RESOLVED")
	}
}

func TestUpdateStatus_NonExistent(t *testing.T) {
	repo := newMockRepo()
	svc := NewService(repo, &mockPlotsRepo{}, &mockAuthRepo{}, &mockNotifService{})

	fakeID := uuid.New()
	err := svc.UpdateStatus(fakeID, "VERIFIED")
	if err == nil {
		t.Error("Expected error for non-existent violation ID")
	}
}

func TestViolationTypes(t *testing.T) {
	repo := newMockRepo()
	svc := NewService(repo, &mockPlotsRepo{}, &mockAuthRepo{}, &mockNotifService{})

	types := []string{"ENCROACHMENT", "GREEN_COVER", "CONSTRUCTION"}
	for _, vType := range types {
		v, err := svc.CreateViolation(CreateViolationRequest{
			PlotID: "P-400",
			Type:   vType,
		})
		if err != nil {
			t.Fatalf("Failed to create violation of type %s: %v", vType, err)
		}
		if v.Type != vType {
			t.Errorf("Expected type '%s', got '%s'", vType, v.Type)
		}
	}
}
