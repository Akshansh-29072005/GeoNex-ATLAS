package reports

import (
	"backend/pkg/auth"
	"backend/pkg/common/middleware"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func RegisterRoutes(rg *gin.RouterGroup, db *gorm.DB, authRepo auth.Repository) {
	service := NewService(db, authRepo)
	handler := NewHandler(service)

	reportsGroup := rg.Group("/reports")
	reportsGroup.Use(middleware.AuthMiddleware())
	{
		reportsGroup.GET("/compliance/stats", handler.GetStats)
		reportsGroup.GET("/compliance/checklist", handler.GetChecklist)
		reportsGroup.GET("/violation/:id/pdf", handler.DownloadViolationReport)
	}
}
