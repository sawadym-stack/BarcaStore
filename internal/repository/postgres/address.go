package postgres

import (
	"github.com/sawadym-stack/barca-store-clean/internal/domain/entities"
	"gorm.io/gorm"
)

type AddressRepository struct {
	db *gorm.DB
}

func NewAddressRepo(db *gorm.DB) *AddressRepository {
	return &AddressRepository{db: db}
}

func (r *AddressRepository) Create(address *entities.Address) error {
	return r.db.Create(address).Error
}

func (r *AddressRepository) FindByID(id int64) (*entities.Address, error) {
	var address entities.Address
	if err := r.db.First(&address, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &address, nil
}

func (r *AddressRepository) FindByUserID(userID int64) ([]*entities.Address, error) {
	var addresses []*entities.Address
	if err := r.db.Where("user_id = ?", userID).Find(&addresses).Error; err != nil {
		return nil, err
	}
	return addresses, nil
}

func (r *AddressRepository) Update(address *entities.Address) error {
	return r.db.Save(address).Error
}

func (r *AddressRepository) Delete(id int64) error {
	return r.db.Delete(&entities.Address{}, id).Error
}

func (r *AddressRepository) CountByUserID(userID int64) (int64, error) {
	var count int64
	if err := r.db.Model(&entities.Address{}).Where("user_id = ?", userID).Count(&count).Error; err != nil {
		return 0, err
	}
	return count, nil
}
