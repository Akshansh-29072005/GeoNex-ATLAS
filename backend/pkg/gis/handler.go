package gis

import (
	"backend/pkg/common/db"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

// PlotGeoJSON represents a plot with its GeoJSON geometry
type PlotGeoJSON struct {
	ID                 string     `json:"id"`
	OwnerID            string     `json:"owner_id"`
	OwnerName          string     `json:"owner_name"`
	AreaSqm            float64    `json:"area_sqm"`
	LocationName       string     `json:"location_name"`
	District           string     `json:"district"`
	Status             string     `json:"status"`
	GeoJSON            string     `json:"geojson"`
	CreatedAt          time.Time  `json:"created_at"`
	AllotmentDate      *time.Time `json:"allotment_date"`
	ProductionDeadline *time.Time `json:"production_deadline"`
}

type Handler struct{}

func NewHandler() *Handler {
	return &Handler{}
}

// GetPlotsAsGeoJSON returns all plots with their geometry as GeoJSON
func (h *Handler) GetPlotsAsGeoJSON(c *gin.Context) {
	var results []PlotGeoJSON
	query := `
		SELECT p.id, p.owner_id, u.name as owner_name, p.area_sqm, p.location_name, p.district, p.status, p.created_at, 
		       ST_AsGeoJSON(p.geom) as geojson,
		       a.allotment_date, a.production_deadline
		FROM plots p
		LEFT JOIN users u ON p.owner_id = u.id
		LEFT JOIN allotments a ON p.id = a.plot_id AND a.status = 'APPROVED'
	`

	if err := db.DB.Raw(query).Scan(&results).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, results)
}

// GetPlotGeometry returns geometry for a specific plot
func (h *Handler) GetPlotGeometry(c *gin.Context) {
	plotID := c.Param("id")
	var result PlotGeoJSON
	query := `
		SELECT p.id, p.owner_id, u.name as owner_name, p.area_sqm, p.location_name, p.district, p.status, p.created_at, 
		       ST_AsGeoJSON(p.geom) as geojson,
		       a.allotment_date, a.production_deadline
		FROM plots p
		LEFT JOIN users u ON p.owner_id = u.id
		LEFT JOIN allotments a ON p.id = a.plot_id AND a.status = 'APPROVED'
		WHERE p.id = ?
	`

	if err := db.DB.Raw(query, plotID).Scan(&result).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, result)
}

// GetPlotsWithinBounds returns plots within a bounding box
func (h *Handler) GetPlotsWithinBounds(c *gin.Context) {
	minLat := c.Query("min_lat")
	minLng := c.Query("min_lng")
	maxLat := c.Query("max_lat")
	maxLng := c.Query("max_lng")

	var results []PlotGeoJSON
	query := `
		SELECT p.id, p.owner_id, u.name as owner_name, p.area_sqm, p.location_name, p.district, p.status, p.created_at, 
		       ST_AsGeoJSON(p.geom) as geojson,
		       a.allotment_date, a.production_deadline
		FROM plots p
		LEFT JOIN users u ON p.owner_id = u.id
		LEFT JOIN allotments a ON p.id = a.plot_id AND a.status = 'APPROVED'
		WHERE ST_Intersects(p.geom, ST_MakeEnvelope(?, ?, ?, ?, 4326))
	`

	if err := db.DB.Raw(query, minLng, minLat, maxLng, maxLat).Scan(&results).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, results)
}

func RegisterRoutes(rg *gin.RouterGroup) {
	handler := NewHandler()

	gisGroup := rg.Group("/gis")
	{
		gisGroup.GET("/plots", handler.GetPlotsAsGeoJSON)
		gisGroup.GET("/plots/:id", handler.GetPlotGeometry)
		gisGroup.GET("/plots/bounds", handler.GetPlotsWithinBounds)
	}
}
