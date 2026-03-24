package postgres

import (
	"github.com/sawadym-stack/barca-store-clean/internal/domain/entities"
	"gorm.io/gorm"
)

type DashboardRepo struct {
	db *gorm.DB
}

func NewDashboardRepo(db *gorm.DB) *DashboardRepo {
	return &DashboardRepo{db: db}
}

func (r *DashboardRepo) GetTotalUsers() (int64, error) {
	var count int64
	err := r.db.Model(&entities.User{}).Count(&count).Error
	return count, err
}

func (r *DashboardRepo) GetTotalOrders() (int64, error) {
	var count int64
	err := r.db.Model(&entities.Order{}).Count(&count).Error
	return count, err
}

func (r *DashboardRepo) GetTotalSales() (float64, error) {
	var total float64
	err := r.db.Model(&entities.Order{}).Where("status != ?", entities.OrderCancelled).Select("SUM(total_amount)").Scan(&total).Error
	return total, err
}

func (r *DashboardRepo) GetPendingOrders() (int64, error) {
	var count int64
	err := r.db.Model(&entities.Order{}).Where("status = ?", entities.OrderPending).Count(&count).Error
	return count, err
}

func (r *DashboardRepo) GetCancelledOrders() (int64, error) {
	var count int64
	err := r.db.Model(&entities.Order{}).Where("status = ?", entities.OrderCancelled).Count(&count).Error
	return count, err
}
