package plots

import (
	"fmt"
	"time"

	"github.com/google/uuid"
)

type Service interface {
	RegisterPlot(req CreatePlotRequest) (*Plot, error)
	GetAllPlots() ([]Plot, error)
}

type service struct {
	repo Repository
}

func NewService(repo Repository) Service {
	return &service{repo: repo}
}

func (s *service) RegisterPlot(req CreatePlotRequest) (*Plot, error) {
	source := req.Source
	if source == "" {
		source = "MANUAL"
	}

	// Generate ID if not provided
	id := req.ID
	if id == "" {
		id = fmt.Sprintf("P-%d", time.Now().Unix())
	}

	// Default Owner (System) if not provided
	ownerID := req.OwnerID
	if ownerID == uuid.Nil {
		ownerID = uuid.MustParse("00000000-0000-0000-0000-000000000000")
	}

	plot := &Plot{
		ID:           id,
		OwnerID:      ownerID,
		AreaSqm:      req.AreaSqm,
		LocationName: req.LocationName,
		District:     req.District,
		Source:       source,
		Status:       "COMPLIANT",
	}

	if err := s.repo.CreatePlot(plot, req.GeoJSON); err != nil {
		return nil, err
	}

	return plot, nil
}

func (s *service) GetAllPlots() ([]Plot, error) {
	return s.repo.GetAllPlots()
}
