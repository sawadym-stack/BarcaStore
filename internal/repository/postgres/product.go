package postgres

import (
	"strings"

	"github.com/sawadym-stack/barca-store-clean/internal/domain/entities"
	"gorm.io/gorm"
)

type ProductRepository struct {
	db *gorm.DB
}

func NewProductRepo(db *gorm.DB) *ProductRepository {
	return &ProductRepository{db: db}
}

func (r *ProductRepository) Create(product *entities.Product) error {
	return r.db.Create(product).Error
}

func (r *ProductRepository) FindByID(id int64) (*entities.Product, error) {
	var product entities.Product
	if err := r.db.First(&product, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &product, nil
}

func (r *ProductRepository) FindAll(limit, offset int) ([]*entities.Product, error) {
	var products []*entities.Product
	if err := r.db.Limit(limit).Offset(offset).Find(&products).Error; err != nil {
		return nil, err
	}
	return products, nil
}

func (r *ProductRepository) FindByCategory(category string, limit, offset int) ([]*entities.Product, error) {
	var products []*entities.Product
	if err := r.db.Where("category = ?", category).Limit(limit).Offset(offset).Find(&products).Error; err != nil {
		return nil, err
	}
	return products, nil
}

func (r *ProductRepository) Update(product *entities.Product) error {
	return r.db.Save(product).Error
}

func (r *ProductRepository) Delete(id int64) error {
	return r.db.Delete(&entities.Product{}, id).Error
}

func (r *ProductRepository) Search(query string, limit, offset int) ([]*entities.Product, error) {
	var products []*entities.Product
	if err := r.db.Where("description ILIKE ?", "%"+query+"%").
		Limit(limit).Offset(offset).Find(&products).Error; err != nil {
		return nil, err
	}
	return products, nil
}

func (r *ProductRepository) UpdateStock(id int64, size string, quantity int) error {
	column := ""
	switch strings.ToUpper(size) {
	case "S":
		column = "stock_s"
	case "M":
		column = "stock_m"
	case "L":
		column = "stock_l"
	case "XL":
		column = "stock_xl"
	default:
		return entities.ErrInvalidSize
	}
	return r.db.Model(&entities.Product{}).Where("id = ?", id).Update(column, gorm.Expr(column+" + ?", quantity)).Error
}
