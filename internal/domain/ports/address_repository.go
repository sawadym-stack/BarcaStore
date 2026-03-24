package ports

import "github.com/sawadym-stack/barca-store-clean/internal/domain/entities"

type AddressRepository interface {
	Create(address *entities.Address) error
	FindByID(id int64) (*entities.Address, error)
	FindByUserID(userID int64) ([]*entities.Address, error)
	Update(address *entities.Address) error
	Delete(id int64) error
	CountByUserID(userID int64) (int64, error)
}
