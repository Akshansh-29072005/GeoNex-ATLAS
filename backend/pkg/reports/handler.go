package reports

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type Handler struct {
	service Service
}

func NewHandler(service Service) *Handler {
	return &Handler{service: service}
}

func (h *Handler) GetStats(c *gin.Context) {
	stats, err := h.service.GetComplianceStats()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch compliance stats"})
		return
	}
	c.JSON(http.StatusOK, stats)
}

func (h *Handler) GetChecklist(c *gin.Context) {
	checklist, err := h.service.GetComplianceChecklist()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch compliance checklist"})
		return
	}
	c.JSON(http.StatusOK, checklist)
}

func (h *Handler) DownloadViolationReport(c *gin.Context) {
	idParam := c.Param("id")
	id, err := uuid.Parse(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid violation ID"})
		return
	}

	pdfBytes, err := h.service.GetViolationReport(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate report"})
		return
	}

	c.Header("Content-Disposition", "attachment; filename=violation_report.pdf")
	c.Data(http.StatusOK, "application/pdf", pdfBytes)
}
