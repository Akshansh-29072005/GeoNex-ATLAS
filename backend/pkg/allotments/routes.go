package allotments

import (
	"backend/pkg/auth"
	"backend/pkg/common/email"
	"backend/pkg/common/middleware"
	"backend/pkg/plots"

	"github.com/gin-gonic/gin"
)

func RegisterRoutes(rg *gin.RouterGroup, plotsRepo plots.Repository) {
	repo := NewRepository()
	authRepo := auth.NewRepository()
	emailService := email.NewGmailService()
	svc := NewService(repo, authRepo, plotsRepo, emailService)
	h := NewHandler(svc)

	// User Routes (inherit AuthMiddleware from rg)
	userGroup := rg.Group("/allotments")
	{
		userGroup.POST("/apply", h.Apply)
		userGroup.GET("/my", h.GetMyApplications)
	}

	// Admin Routes (inherit AuthMiddleware, add RoleMiddleware)
	adminGroup := rg.Group("/admin/allotments")
	adminGroup.Use(middleware.RoleMiddleware("SUPER_ADMIN", "ADMIN"))
	{
		adminGroup.GET("/", h.GetAllApplications)
		adminGroup.PATCH("/:id/status", h.UpdateStatus)
	}
}
