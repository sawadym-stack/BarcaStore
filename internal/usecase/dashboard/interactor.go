package dashboard

import "github.com/sawadym-stack/barca-store-clean/internal/domain/ports"

type Interactor struct {
	dashboardRepo ports.DashboardRepository
}

func NewInteractor(dashboardRepo ports.DashboardRepository) *Interactor {
	return &Interactor{dashboardRepo: dashboardRepo}
}

type MetricsResponse struct {
	TotalUsers      int64   `json:"total_users"`
	TotalOrders     int64   `json:"total_orders"`
	TotalSales      float64 `json:"total_revenue"`
	PendingOrders   int64   `json:"pending_orders"`
	CancelledOrders int64   `json:"cancelled_orders"`
}

func (i *Interactor) GetDashboardMetrics() (*MetricsResponse, error) {
	users, _ := i.dashboardRepo.GetTotalUsers()
	orders, _ := i.dashboardRepo.GetTotalOrders()
	sales, _ := i.dashboardRepo.GetTotalSales()
	pending, _ := i.dashboardRepo.GetPendingOrders()
	cancelled, _ := i.dashboardRepo.GetCancelledOrders()

	return &MetricsResponse{
		TotalUsers:      users,
		TotalOrders:     orders,
		TotalSales:      sales,
		PendingOrders:   pending,
		CancelledOrders: cancelled,
	}, nil
}
