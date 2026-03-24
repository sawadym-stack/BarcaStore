package address

import (
	"errors"

	"github.com/sawadym-stack/barca-store-clean/internal/domain/entities"
	"github.com/sawadym-stack/barca-store-clean/internal/domain/ports"
)

type Interactor struct {
	addressRepo ports.AddressRepository
}

func NewInteractor(addressRepo ports.AddressRepository) *Interactor {
	return &Interactor{addressRepo: addressRepo}
}

type AddressInput struct {
	UserID      int64
	Name        string
	Phone       string
	AddressLine string
	City        string
	State       string
	Pincode     string
	Country     string
}

func (i *Interactor) AddAddress(input AddressInput) (*entities.Address, error) {
	count, err := i.addressRepo.CountByUserID(input.UserID)
	if err != nil {
		return nil, err
	}

	if count >= 3 {
		return nil, errors.New("maximum of 3 addresses allowed per user")
	}

	address := &entities.Address{
		UserID:      input.UserID,
		Name:        input.Name,
		Phone:       input.Phone,
		AddressLine: input.AddressLine,
		City:        input.City,
		State:       input.State,
		Pincode:     input.Pincode,
		Country:     input.Country,
	}

	if err := i.addressRepo.Create(address); err != nil {
		return nil, err
	}

	return address, nil
}

func (i *Interactor) GetUserAddresses(userID int64) ([]*entities.Address, error) {
	return i.addressRepo.FindByUserID(userID)
}

func (i *Interactor) UpdateAddress(id int64, userID int64, input AddressInput) (*entities.Address, error) {
	address, err := i.addressRepo.FindByID(id)
	if err != nil {
		return nil, err
	}

	if address == nil {
		return nil, errors.New("address not found")
	}

	if address.UserID != userID {
		return nil, errors.New("unauthorized to update this address")
	}

	address.Name = input.Name
	address.Phone = input.Phone
	address.AddressLine = input.AddressLine
	address.City = input.City
	address.State = input.State
	address.Pincode = input.Pincode
	if input.Country != "" {
		address.Country = input.Country
	}

	if err := i.addressRepo.Update(address); err != nil {
		return nil, err
	}

	return address, nil
}

func (i *Interactor) DeleteAddress(id int64, userID int64) error {
	address, err := i.addressRepo.FindByID(id)
	if err != nil {
		return err
	}

	if address == nil {
		return errors.New("address not found")
	}

	if address.UserID != userID {
		return errors.New("unauthorized to delete this address")
	}

	return i.addressRepo.Delete(id)
}
