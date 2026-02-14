package plots

import (
	"testing"

	"github.com/google/uuid"
)

// ============================================
// MOCK REPOSITORY
// ============================================

type mockRepository struct {
	plots map[string]*Plot
}

func newMockRepo() *mockRepository {
	return &mockRepository{plots: make(map[string]*Plot)}
}

func (m *mockRepository) CreatePlot(plot *Plot, geojson string) error {
	m.plots[plot.ID] = plot
	return nil
}

func (m *mockRepository) GetAllPlots() ([]Plot, error) {
	var result []Plot
	for _, p := range m.plots {
		result = append(result, *p)
	}
	return result, nil
}

func (m *mockRepository) FindByID(id string) (*Plot, error) {
	p, exists := m.plots[id]
	if !exists {
		return nil, nil // or error
	}
	return p, nil
}

func (m *mockRepository) UpdateOwner(id string, ownerID string) error {
	if p, exists := m.plots[id]; exists {
		// Parse UUID for mock consistency, though ID is string here
		u, _ := uuid.Parse(ownerID)
		p.OwnerID = u
	}
	return nil
}

func (m *mockRepository) UpdateStatus(id string, status string) error {
	if p, exists := m.plots[id]; exists {
		p.Status = status
	}
	return nil
}

// ============================================
// TESTS
// ============================================

func TestRegisterPlot(t *testing.T) {
	repo := newMockRepo()
	svc := NewService(repo)

	req := CreatePlotRequest{
		ID:           "P-501",
		OwnerID:      uuid.New(),
		AreaSqm:      2400.0,
		LocationName: "Urla Industrial Area",
		District:     "Raipur",
		Source:       "IMPORTED",
		GeoJSON:      `{"type":"Polygon","coordinates":[[[81.62,21.25],[81.63,21.25],[81.63,21.26],[81.62,21.26],[81.62,21.25]]]}`,
	}

	plot, err := svc.RegisterPlot(req)
	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}

	if plot.ID != "P-501" {
		t.Errorf("Expected Plot ID 'P-501', got '%s'", plot.ID)
	}
	if plot.District != "Raipur" {
		t.Errorf("Expected District 'Raipur', got '%s'", plot.District)
	}
	if plot.Source != "IMPORTED" {
		t.Errorf("Expected Source 'IMPORTED', got '%s'", plot.Source)
	}
	if plot.Status != "COMPLIANT" {
		t.Errorf("New plots should default to 'COMPLIANT', got '%s'", plot.Status)
	}
	if plot.AreaSqm != 2400.0 {
		t.Errorf("Expected area 2400.0, got %f", plot.AreaSqm)
	}
}

func TestRegisterPlot_DefaultStatus(t *testing.T) {
	repo := newMockRepo()
	svc := NewService(repo)

	req := CreatePlotRequest{
		ID:       "P-502",
		OwnerID:  uuid.New(),
		AreaSqm:  1000.0,
		District: "Durg",
		GeoJSON:  `{"type":"Polygon","coordinates":[[[0,0],[1,0],[1,1],[0,1],[0,0]]]}`,
	}

	plot, _ := svc.RegisterPlot(req)
	if plot.Status != "COMPLIANT" {
		t.Errorf("Expected default status 'COMPLIANT', got '%s'", plot.Status)
	}
	if plot.Source != "MANUAL" {
		t.Errorf("Expected default source 'MANUAL', got '%s'", plot.Source)
	}
}

func TestGetAllPlots(t *testing.T) {
	repo := newMockRepo()
	svc := NewService(repo)

	svc.RegisterPlot(CreatePlotRequest{ID: "P-601", OwnerID: uuid.New(), AreaSqm: 500, GeoJSON: "{}"})
	svc.RegisterPlot(CreatePlotRequest{ID: "P-602", OwnerID: uuid.New(), AreaSqm: 700, GeoJSON: "{}"})

	plots, err := svc.GetAllPlots()
	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}

	if len(plots) != 2 {
		t.Errorf("Expected 2 plots, got %d", len(plots))
	}
}
