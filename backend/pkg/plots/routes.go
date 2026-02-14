package plots

import (
	"github.com/gin-gonic/gin"
)

func RegisterRoutes(rg *gin.RouterGroup) {
	repo := NewRepository()
	svc := NewService(repo)
	handler := NewHandler(svc)

	plotGroup := rg.Group("/plots")
	{
		plotGroup.POST("/register", handler.RegisterPlot)
		plotGroup.GET("/", handler.GetAllPlots)
	}
}
