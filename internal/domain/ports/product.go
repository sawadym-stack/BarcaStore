package ports

import "github.com/sawadym-stack/barca-store-clean/internal/domain/entities"

type ProductRepository interface {
	Create(product *entities.Product) error
	FindByID(id int64) (*entities.Product, error)
	FindAll(limit, offset int) ([]*entities.Product, error)
	FindByCategory(category string, limit, offset int) ([]*entities.Product, error)
	Update(product *entities.Product) error
	Delete(id int64) error
	Search(query string, limit, offset int) ([]*entities.Product, error)
	UpdateStock(id int64, size string, quantity int) error
}
