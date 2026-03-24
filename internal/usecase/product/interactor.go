package product

import (
	"errors"

	"github.com/sawadym-stack/barca-store-clean/internal/domain/entities"
	"github.com/sawadym-stack/barca-store-clean/internal/domain/ports"
)

type Interactor struct {
	repo ports.ProductRepository
}

func NewInteractor(repo ports.ProductRepository) *Interactor {
	return &Interactor{
		repo: repo,
	}
}

type CreateProductInput struct {
	Name        string
	Description string
	Price       float64
	StockS      int
	StockM      int
	StockL      int
	StockXL     int
	Category    string
	Gender      string
	ImageURL    string
}

type UpdateProductInput struct {
	ID          int64
	Name        string
	Description string
	Price       float64
	StockS      *int
	StockM      *int
	StockL      *int
	StockXL     *int
	Category    string
	Gender      string
	ImageURL    string
}

type ProductOutput struct {
	ID          int64
	Name        string
	Description string
	Price       float64
	StockS      int
	StockM      int
	StockL      int
	StockXL     int
	Category    string
	Gender      string
	ImageURL    string
	CreatedAt   string
	UpdatedAt   string
}

// CreateProduct creates a new product (admin only)
func (i *Interactor) CreateProduct(input CreateProductInput) (*ProductOutput, error) {
	if input.Name == "" || input.Price <= 0 || input.Category == "" {
		return nil, errors.New("name, price, and category are required")
	}

	product := &entities.Product{
		Name:        input.Name,
		Description: input.Description,
		Price:       input.Price,
		StockS:      input.StockS,
		StockM:      input.StockM,
		StockL:      input.StockL,
		StockXL:     input.StockXL,
		Category:    input.Category,
		Gender:      input.Gender,
		ImageURL:    input.ImageURL,
	}

	if err := i.repo.Create(product); err != nil {
		return nil, err
	}

	return &ProductOutput{
		ID:          product.ID,
		Name:        product.Name,
		Description: product.Description,
		Price:       product.Price,
		StockS:      product.StockS,
		StockM:      product.StockM,
		StockL:      product.StockL,
		StockXL:     product.StockXL,
		Category:    product.Category,
		Gender:      product.Gender,
		ImageURL:    product.ImageURL,
		CreatedAt:   product.CreatedAt.String(),
		UpdatedAt:   product.UpdatedAt.String(),
	}, nil
}

// GetProduct retrieves product by ID
func (i *Interactor) GetProduct(id int64) (*ProductOutput, error) {
	if id <= 0 {
		return nil, errors.New("invalid product ID")
	}

	product, err := i.repo.FindByID(id)
	if err != nil {
		return nil, err
	}

	if product == nil {
		return nil, errors.New("product not found")
	}

	return &ProductOutput{
		ID:          product.ID,
		Name:        product.Name,
		Description: product.Description,
		Price:       product.Price,
		StockS:      product.StockS,
		StockM:      product.StockM,
		StockL:      product.StockL,
		StockXL:     product.StockXL,
		Category:    product.Category,
		Gender:      product.Gender,
		ImageURL:    product.ImageURL,
		CreatedAt:   product.CreatedAt.String(),
		UpdatedAt:   product.UpdatedAt.String(),
	}, nil
}

// ListProducts lists all products with pagination
func (i *Interactor) ListProducts(limit, offset int) ([]*ProductOutput, error) {
	if limit < 1 {
		limit = 100
	}
	if limit > 500 {
		limit = 500
	}
	if offset < 0 {
		offset = 0
	}

	products, err := i.repo.FindAll(limit, offset)
	if err != nil {
		return nil, err
	}

	outputs := make([]*ProductOutput, len(products))
	for i, p := range products {
		outputs[i] = &ProductOutput{
			ID:          p.ID,
			Name:        p.Name,
			Description: p.Description,
			Price:       p.Price,
			StockS:      p.StockS,
			StockM:      p.StockM,
			StockL:      p.StockL,
			StockXL:     p.StockXL,
			Category:    p.Category,
			Gender:      p.Gender,
			ImageURL:    p.ImageURL,
			CreatedAt:   p.CreatedAt.String(),
			UpdatedAt:   p.UpdatedAt.String(),
		}
	}

	return outputs, nil
}

// ListByCategory lists products by category
func (i *Interactor) ListByCategory(category string, limit, offset int) ([]*ProductOutput, error) {
	if category == "" {
		return nil, errors.New("category is required")
	}

	if limit < 1 {
		limit = 100
	}
	if limit > 500 {
		limit = 500
	}
	if offset < 0 {
		offset = 0
	}

	products, err := i.repo.FindByCategory(category, limit, offset)
	if err != nil {
		return nil, err
	}

	outputs := make([]*ProductOutput, len(products))
	for i, p := range products {
		outputs[i] = &ProductOutput{
			ID:          p.ID,
			Name:        p.Name,
			Description: p.Description,
			Price:       p.Price,
			StockS:      p.StockS,
			StockM:      p.StockM,
			StockL:      p.StockL,
			StockXL:     p.StockXL,
			Category:    p.Category,
			Gender:      p.Gender,
			ImageURL:    p.ImageURL,
			CreatedAt:   p.CreatedAt.String(),
			UpdatedAt:   p.UpdatedAt.String(),
		}
	}

	return outputs, nil
}

// UpdateProduct updates product info (admin only)
func (i *Interactor) UpdateProduct(input UpdateProductInput) (*ProductOutput, error) {
	if input.ID <= 0 {
		return nil, errors.New("invalid product ID")
	}

	product, err := i.repo.FindByID(input.ID)
	if err != nil {
		return nil, err
	}

	if product == nil {
		return nil, errors.New("product not found")
	}

	// Update fields if provided
	if input.Name != "" {
		product.Name = input.Name
	}
	if input.Description != "" {
		product.Description = input.Description
	}
	if input.Price > 0 {
		product.Price = input.Price
	}
	if input.Category != "" {
		product.Category = input.Category
	}
	if input.Gender != "" {
		product.Gender = input.Gender
	}
	if input.ImageURL != "" {
		product.ImageURL = input.ImageURL
	}
	if input.StockS != nil {
		product.StockS = *input.StockS
	}
	if input.StockM != nil {
		product.StockM = *input.StockM
	}
	if input.StockL != nil {
		product.StockL = *input.StockL
	}
	if input.StockXL != nil {
		product.StockXL = *input.StockXL
	}

	if err := i.repo.Update(product); err != nil {
		return nil, err
	}

	return &ProductOutput{
		ID:          product.ID,
		Name:        product.Name,
		Description: product.Description,
		Price:       product.Price,
		StockS:      product.StockS,
		StockM:      product.StockM,
		StockL:      product.StockL,
		StockXL:     product.StockXL,
		Category:    product.Category,
		Gender:      product.Gender,
		ImageURL:    product.ImageURL,
		CreatedAt:   product.CreatedAt.String(),
		UpdatedAt:   product.UpdatedAt.String(),
	}, nil
}

// DeleteProduct deletes a product (admin only)
func (i *Interactor) DeleteProduct(id int64) error {
	if id <= 0 {
		return errors.New("invalid product ID")
	}

	product, err := i.repo.FindByID(id)
	if err != nil {
		return err
	}

	if product == nil {
		return errors.New("product not found")
	}

	return i.repo.Delete(id)
}

// SearchProducts searches products by name or description
func (i *Interactor) SearchProducts(query string, limit, offset int) ([]*ProductOutput, error) {
	if query == "" {
		return nil, errors.New("search query is required")
	}

	if limit < 1 {
		limit = 100
	}
	if limit > 500 {
		limit = 500
	}
	if offset < 0 {
		offset = 0
	}

	products, err := i.repo.Search(query, limit, offset)
	if err != nil {
		return nil, err
	}

	outputs := make([]*ProductOutput, len(products))
	for i, p := range products {
		outputs[i] = &ProductOutput{
			ID:          p.ID,
			Name:        p.Name,
			Description: p.Description,
			Price:       p.Price,
			StockS:      p.StockS,
			StockM:      p.StockM,
			StockL:      p.StockL,
			StockXL:     p.StockXL,
			Category:    p.Category,
			Gender:      p.Gender,
			ImageURL:    p.ImageURL,
			CreatedAt:   p.CreatedAt.String(),
			UpdatedAt:   p.UpdatedAt.String(),
		}
	}

	return outputs, nil
}

// UpdateStock updates product stock (admin only)
func (i *Interactor) UpdateStock(id int64, size string, quantity int) error {
	if id <= 0 {
		return errors.New("invalid product ID")
	}

	product, err := i.repo.FindByID(id)
	if err != nil {
		return err
	}

	if product == nil {
		return errors.New("product not found")
	}

	return i.repo.UpdateStock(id, size, quantity)
}
