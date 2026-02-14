package plots

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

func (h *Handler) RegisterPlot(c *gin.Context) {
	var req CreatePlotRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID := c.MustGet("user_id").(string)
	userRole := c.MustGet("user_role").(string)

	// If Admin/SuperAdmin, use System UUID (0000...) to mark as "Available/Govt"
	// If Industry, use their actual UUID to mark as "Leased/Owned"
	if userRole == "ADMIN" || userRole == "SUPER_ADMIN" {
		req.OwnerID = uuid.MustParse("00000000-0000-0000-0000-000000000000")
	} else {
		ownerID, err := uuid.Parse(userID)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid user ID"})
			return
		}
		req.OwnerID = ownerID
	}

	plot, err := h.service.RegisterPlot(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, plot)
}

func (h *Handler) GetAllPlots(c *gin.Context) {
	plots, err := h.service.GetAllPlots()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, plots)
}
