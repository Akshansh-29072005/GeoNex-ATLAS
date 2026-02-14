package plots

import (
	"time"

	"github.com/google/uuid"
)

type Plot struct {
	ID           string    `gorm:"primaryKey" json:"id"`
	OwnerID      uuid.UUID `gorm:"type:uuid;not null" json:"owner_id"`
	AreaSqm      float64   `json:"area_sqm"`
	LocationName string    `json:"location_name"`
	District     string    `json:"district"`
	Source       string    `json:"source"`                             // MANUAL, IMPORTED
	Status       string    `json:"status"`                             // COMPLIANT, VIOLATION
	Geom         string    `gorm:"type:geometry" json:"-"`             // PostGIS Geometry
	GeoJSON      string    `gorm:"column:plot_geojson" json:"geojson"` // Populated via Query (Read Only)
	CreatedAt    time.Time `json:"created_at"`
}

type CreatePlotRequest struct {
	ID           string    `json:"id"`       // Computed if empty
	OwnerID      uuid.UUID `json:"owner_id"` // Optional (defaults to system)
	AreaSqm      float64   `json:"area_sqm"` // Computed
	LocationName string    `json:"location_name"`
	District     string    `json:"district" binding:"required"`
	Source       string    `json:"source"`
	GeoJSON      string    `json:"geojson" binding:"required"` // Raw GeoJSON string
}
