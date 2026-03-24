package handler

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/sawadym-stack/barca-store-clean/internal/transport/http/dto"
	"github.com/sawadym-stack/barca-store-clean/internal/usecase/product"
)

type ProductHandler struct {
	productUC *product.Interactor
}

func NewProductHandler(productUC *product.Interactor) *ProductHandler {
	return &ProductHandler{
		productUC: productUC,
	}
}

// CreateProduct creates a new product (admin only)
func (h *ProductHandler) CreateProduct(c *gin.Context) {
	var req dto.CreateProductRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	output, err := h.productUC.CreateProduct(product.CreateProductInput{
		Name:        req.Name,
		Description: req.Description,
		Price:       req.Price,
		StockS:      req.StockS,
		StockM:      req.StockM,
		StockL:      req.StockL,
		StockXL:     req.StockXL,
		Category:    req.Category,
		Gender:      req.Gender,
		ImageURL:    req.ImageURL,
	})
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusCreated, dto.ProductResponse{
		ID:          output.ID,
		Name:        output.Name,
		Description: output.Description,
		Price:       output.Price,
		StockS:      output.StockS,
		StockM:      output.StockM,
		StockL:      output.StockL,
		StockXL:     output.StockXL,
		Category:    output.Category,
		Gender:      output.Gender,
		ImageURL:    output.ImageURL,
		CreatedAt:   output.CreatedAt,
		UpdatedAt:   output.UpdatedAt,
	})
}

// GetProduct retrieves single product
func (h *ProductHandler) GetProduct(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "invalid product ID"})
		return
	}

	output, err := h.productUC.GetProduct(id)
	if err != nil {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.ProductResponse{
		ID:          output.ID,
		Name:        output.Name,
		Description: output.Description,
		Price:       output.Price,
		StockS:      output.StockS,
		StockM:      output.StockM,
		StockL:      output.StockL,
		StockXL:     output.StockXL,
		Category:    output.Category,
		Gender:      output.Gender,
		ImageURL:    output.ImageURL,
		CreatedAt:   output.CreatedAt,
		UpdatedAt:   output.UpdatedAt,
	})
}

// ListProducts lists all products with pagination
func (h *ProductHandler) ListProducts(c *gin.Context) {
	limitStr := c.DefaultQuery("limit", "100")
	offsetStr := c.DefaultQuery("offset", "0")

	limit, _ := strconv.Atoi(limitStr)
	offset, _ := strconv.Atoi(offsetStr)

	outputs, err := h.productUC.ListProducts(limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	response := make([]dto.ProductResponse, len(outputs))
	for i, o := range outputs {
		response[i] = dto.ProductResponse{
			ID:          o.ID,
			Name:        o.Name,
			Description: o.Description,
			Price:       o.Price,
			StockS:      o.StockS,
			StockM:      o.StockM,
			StockL:      o.StockL,
			StockXL:     o.StockXL,
			Category:    o.Category,
			Gender:      o.Gender,
			ImageURL:    o.ImageURL,
			CreatedAt:   o.CreatedAt,
			UpdatedAt:   o.UpdatedAt,
		}
	}

	c.JSON(http.StatusOK, response)
}

// ListByCategory lists products by category
func (h *ProductHandler) ListByCategory(c *gin.Context) {
	category := c.Query("category")
	limitStr := c.DefaultQuery("limit", "100")
	offsetStr := c.DefaultQuery("offset", "0")

	if category == "" {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "category parameter required"})
		return
	}

	limit, _ := strconv.Atoi(limitStr)
	offset, _ := strconv.Atoi(offsetStr)

	outputs, err := h.productUC.ListByCategory(category, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	response := make([]dto.ProductResponse, len(outputs))
	for i, o := range outputs {
		response[i] = dto.ProductResponse{
			ID:          o.ID,
			Name:        o.Name,
			Description: o.Description,
			Price:       o.Price,
			StockS:      o.StockS,
			StockM:      o.StockM,
			StockL:      o.StockL,
			StockXL:     o.StockXL,
			Category:    o.Category,
			Gender:      o.Gender,
			ImageURL:    o.ImageURL,
			CreatedAt:   o.CreatedAt,
			UpdatedAt:   o.UpdatedAt,
		}
	}

	c.JSON(http.StatusOK, response)
}

// UpdateProduct updates product (admin only)
func (h *ProductHandler) UpdateProduct(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "invalid product ID"})
		return
	}

	var req dto.UpdateProductRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	output, err := h.productUC.UpdateProduct(product.UpdateProductInput{
		ID:          id,
		Name:        req.Name,
		Description: req.Description,
		Price:       req.Price,
		StockS:      req.StockS,
		StockM:      req.StockM,
		StockL:      req.StockL,
		StockXL:     req.StockXL,
		Category:    req.Category,
		Gender:      req.Gender,
		ImageURL:    req.ImageURL,
	})
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.ProductResponse{
		ID:          output.ID,
		Name:        output.Name,
		Description: output.Description,
		Price:       output.Price,
		StockS:      output.StockS,
		StockM:      output.StockM,
		StockL:      output.StockL,
		StockXL:     output.StockXL,
		Category:    output.Category,
		Gender:      output.Gender,
		ImageURL:    output.ImageURL,
		CreatedAt:   output.CreatedAt,
		UpdatedAt:   output.UpdatedAt,
	})
}

// DeleteProduct deletes a product (admin only)
func (h *ProductHandler) DeleteProduct(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "invalid product ID"})
		return
	}

	if err := h.productUC.DeleteProduct(id); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.MessageResponse{Message: "Product deleted successfully"})
}

// SearchProducts searches products
func (h *ProductHandler) SearchProducts(c *gin.Context) {
	query := c.Query("q")
	limitStr := c.DefaultQuery("limit", "100")
	offsetStr := c.DefaultQuery("offset", "0")

	if query == "" {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "search query parameter 'q' required"})
		return
	}

	limit, _ := strconv.Atoi(limitStr)
	offset, _ := strconv.Atoi(offsetStr)

	outputs, err := h.productUC.SearchProducts(query, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	response := make([]dto.ProductResponse, len(outputs))
	for i, o := range outputs {
		response[i] = dto.ProductResponse{
			ID:          o.ID,
			Name:        o.Name,
			Description: o.Description,
			Price:       o.Price,
			StockS:      o.StockS,
			StockM:      o.StockM,
			StockL:      o.StockL,
			StockXL:     o.StockXL,
			Category:    o.Category,
			Gender:      o.Gender,
			ImageURL:    o.ImageURL,
			CreatedAt:   o.CreatedAt,
			UpdatedAt:   o.UpdatedAt,
		}
	}

	c.JSON(http.StatusOK, response)
}

// UpdateStock updates product stock (admin only)
func (h *ProductHandler) UpdateStock(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "invalid product ID"})
		return
	}

	var req struct {
		Size     string `json:"size" binding:"required"`
		Quantity int    `json:"quantity" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	if err := h.productUC.UpdateStock(id, req.Size, req.Quantity); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.MessageResponse{Message: "Stock updated successfully"})
}
