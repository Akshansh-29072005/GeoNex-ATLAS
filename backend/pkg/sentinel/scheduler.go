package sentinel

import (
	"backend/pkg/common/db"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/google/uuid"
)

// AnalysisJob tracks a satellite image processing job
type AnalysisJob struct {
	ID                 uuid.UUID  `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	PlotID             string     `json:"plot_id"`
	Status             string     `json:"status"` // PENDING, PROCESSING, COMPLETED, FAILED
	SatelliteImageDate *time.Time `json:"satellite_image_date"`
	NDVIScore          *float64   `json:"ndvi_score"`
	ProcessedAt        *time.Time `json:"processed_at"`
}

// SentinelConfig holds Sentinel Hub API configuration
type SentinelConfig struct {
	APIBaseURL   string
	ClientID     string
	ClientSecret string
	InstanceID   string
}

// Scheduler manages periodic satellite image fetching
type Scheduler struct {
	config    SentinelConfig
	interval  time.Duration
	pythonURL string
	stopChan  chan struct{}
}

// NewScheduler creates a new Sentinel scheduler
// Default interval: 10 days (Sentinel-2 revisit time)
func NewScheduler() *Scheduler {
	return &Scheduler{
		config: SentinelConfig{
			APIBaseURL:   "https://services.sentinel-hub.com",
			ClientID:     os.Getenv("SENTINEL_CLIENT_ID"),
			ClientSecret: os.Getenv("SENTINEL_CLIENT_SECRET"),
			InstanceID:   os.Getenv("SENTINEL_INSTANCE_ID"),
		},
		interval:  10 * 24 * time.Hour, // 10 days
		pythonURL: os.Getenv("PYTHON_SERVICE_URL"),
		stopChan:  make(chan struct{}),
	}
}

// Start begins the periodic satellite image fetching cycle
func (s *Scheduler) Start() {
	log.Println("[SENTINEL] 🛰️  Scheduler started — fetching every 10 days")

	// Run immediately on start
	go s.runCycle()

	ticker := time.NewTicker(s.interval)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			go s.runCycle()
		case <-s.stopChan:
			log.Println("[SENTINEL] Scheduler stopped")
			return
		}
	}
}

// Stop gracefully stops the scheduler
func (s *Scheduler) Stop() {
	close(s.stopChan)
}

// runCycle processes all active plots
func (s *Scheduler) runCycle() {
	log.Println("[SENTINEL] Starting fetch cycle...")

	// Get all active plots that need processing
	var plotIDs []string
	db.DB.Raw("SELECT id FROM plots WHERE status != 'INACTIVE'").Scan(&plotIDs)

	log.Printf("[SENTINEL] Found %d plots to process", len(plotIDs))

	for _, plotID := range plotIDs {
		s.processPlot(plotID)
	}

	log.Println("[SENTINEL] Fetch cycle complete")
}

// processPlot fetches and analyzes satellite data for a single plot
func (s *Scheduler) processPlot(plotID string) {
	// 1. Create a job entry
	job := AnalysisJob{
		PlotID: plotID,
		Status: "PROCESSING",
	}
	db.DB.Create(&job)

	// 2. Get plot bounding box from PostGIS
	var bbox string
	db.DB.Raw(`SELECT ST_AsText(ST_Envelope(geom)) FROM plots WHERE id = ?`, plotID).Scan(&bbox)

	if bbox == "" {
		log.Printf("[SENTINEL] No geometry found for plot %s, skipping", plotID)
		db.DB.Model(&job).Update("status", "FAILED")
		return
	}

	// 3. Call Python analysis service to fetch Sentinel imagery
	resp, err := s.callPythonService(plotID, bbox)
	if err != nil {
		log.Printf("[SENTINEL] Error processing plot %s: %v", plotID, err)
		db.DB.Model(&job).Update("status", "FAILED")
		return
	}

	// 4. Update job with results
	now := time.Now()
	job.Status = "COMPLETED"
	job.ProcessedAt = &now
	if ndvi, ok := resp["ndvi_score"].(float64); ok {
		job.NDVIScore = &ndvi
	}
	db.DB.Save(&job)

	log.Printf("[SENTINEL] ✅ Plot %s processed successfully", plotID)
}

// callPythonService makes an HTTP call to the Python analysis service
func (s *Scheduler) callPythonService(plotID string, bbox string) (map[string]interface{}, error) {
	url := fmt.Sprintf("%s/analyze/sentinel/fetch?plot_id=%s&bbox=%s", s.pythonURL, plotID, bbox)

	resp, err := http.Post(url, "application/json", nil)
	if err != nil {
		return nil, fmt.Errorf("failed to reach analysis service: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	var result map[string]interface{}
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	return result, nil
}
