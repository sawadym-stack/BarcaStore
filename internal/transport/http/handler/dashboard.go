package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/sawadym-stack/barca-store-clean/internal/transport/http/dto"
	"github.com/sawadym-stack/barca-store-clean/internal/usecase/dashboard"
)

type DashboardHandler struct {
	dashboardUC *dashboard.Interactor
}

func NewDashboardHandler(dashboardUC *dashboard.Interactor) *DashboardHandler {
	return &DashboardHandler{dashboardUC: dashboardUC}
}

func (h *DashboardHandler) GetMetrics(c *gin.Context) {
	metrics, err := h.dashboardUC.GetDashboardMetrics()
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, metrics)
}
