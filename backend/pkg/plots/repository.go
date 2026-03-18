package plots

import (
	"backend/pkg/common/db"

	"gorm.io/gorm"
)

type Repository interface {
	CreatePlot(plot *Plot, geojson string) error
	GetAllPlots() ([]Plot, error)
	FindByID(id string) (*Plot, error)
	UpdateOwner(id string, ownerID string) error
	UpdateStatus(id string, status string) error
}

type repository struct {
	db *gorm.DB
}

func NewRepository() Repository {
	return &repository{db: db.DB}
}

func (r *repository) CreatePlot(plot *Plot, geojson string) error {
	// Calculate Area using PostGIS (ST_Area of Geography gives Square Meters)
	query := `INSERT INTO plots (id, owner_id, area_sqm, location_name, district, source, status, geom, created_at) 
			  VALUES (?, ?, ST_Area(ST_SetSRID(ST_GeomFromGeoJSON(?), 4326)::geography), ?, ?, ?, ?, ST_Multi(ST_SetSRID(ST_GeomFromGeoJSON(?), 4326)), NOW())
			  RETURNING area_sqm`

	// Use Scan to update AreaSqm
	var areaSqm float64
	if err := r.db.Raw(query, plot.ID, plot.OwnerID, geojson, plot.LocationName, plot.District, plot.Source, plot.Status, geojson).Scan(&areaSqm).Error; err != nil {
		return err
	}
	plot.AreaSqm = areaSqm
	return nil
}

func (r *repository) GetAllPlots() ([]Plot, error) {
	var plots []Plot
	// Select all fields + GeoJSON
	// Select all fields + GeoJSON with unique alias
	query := `SELECT id, owner_id, area_sqm, location_name, district, source, status, created_at, ST_AsGeoJSON(geom) as plot_geojson FROM plots`
	if err := r.db.Raw(query).Scan(&plots).Error; err != nil {
		return nil, err
	}
	// Debug Log
	if len(plots) > 0 {
		// Log the first plot's GeoJSON length to verify data presence
		// fmt.Printf("DEBUG: Loaded %d plots. First Plot GeoJSON Len: %d\n", len(plots), len(plots[0].GeoJSON))
	}
	return plots, nil
}

func (r *repository) FindByID(id string) (*Plot, error) {
	var plot Plot
	// Select all fields + GeoJSON
	query := `SELECT id, owner_id, area_sqm, location_name, district, source, status, created_at, ST_AsGeoJSON(geom) as plot_geojson FROM plots WHERE id = ?`
	if err := r.db.Raw(query, id).Scan(&plot).Error; err != nil {
		return nil, err
	}
	return &plot, nil
}

func (r *repository) UpdateOwner(id string, ownerID string) error {
	return r.db.Model(&Plot{}).Where("id = ?", id).Update("owner_id", ownerID).Error
}

func (r *repository) UpdateStatus(id string, status string) error {
	return r.db.Model(&Plot{}).Where("id = ?", id).Update("status", status).Error
}
