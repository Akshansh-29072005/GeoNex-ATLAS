package violations

import (
	"backend/pkg/auth"
	"backend/pkg/notifications"
	"backend/pkg/plots"

	"github.com/gin-gonic/gin"
)

func RegisterRoutes(rg *gin.RouterGroup, plotRepo plots.Repository, userRepo auth.Repository, notif notifications.Service) {
	repo := NewRepository()
	svc := NewService(repo, plotRepo, userRepo, notif)
	handler := NewHandler(svc)

	vGroup := rg.Group("/violations")
	{
		vGroup.POST("/", handler.CreateViolation)
		vGroup.GET("/", handler.GetAllViolations)
		vGroup.GET("/plot/:plotId", handler.GetByPlotID)
		vGroup.PATCH("/:id/status", handler.UpdateStatus)

		// New Actions
		vGroup.POST("/:id/assign", handler.AssignOfficer)
		vGroup.POST("/:id/notice", handler.GenerateNotice)
		vGroup.POST("/:id/verify", handler.VerifyViolation)
		vGroup.POST("/:id/close", handler.CloseCase)
	}
}
