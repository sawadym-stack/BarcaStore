package handler

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/sawadym-stack/barca-store-clean/internal/transport/http/dto"
	"github.com/sawadym-stack/barca-store-clean/internal/usecase/address"
)

type AddressHandler struct {
	addressUC *address.Interactor
}

func NewAddressHandler(addressUC *address.Interactor) *AddressHandler {
	return &AddressHandler{addressUC: addressUC}
}

func (h *AddressHandler) AddAddress(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, dto.ErrorResponse{Error: "unauthorized"})
		return
	}

	var req dto.AddressRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	addr, err := h.addressUC.AddAddress(address.AddressInput{
		UserID:      userID.(int64),
		Name:        req.Name,
		Phone:       req.Phone,
		AddressLine: req.AddressLine,
		City:        req.City,
		State:       req.State,
		Pincode:     req.Pincode,
		Country:     req.Country,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusCreated, dto.AddressResponse{
		ID:          addr.ID,
		UserID:      addr.UserID,
		Name:        addr.Name,
		Phone:       addr.Phone,
		AddressLine: addr.AddressLine,
		City:        addr.City,
		State:       addr.State,
		Pincode:     addr.Pincode,
		Country:     addr.Country,
	})
}

func (h *AddressHandler) GetUserAddresses(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, dto.ErrorResponse{Error: "unauthorized"})
		return
	}

	addresses, err := h.addressUC.GetUserAddresses(userID.(int64))
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	response := make([]dto.AddressResponse, len(addresses))
	for i, addr := range addresses {
		response[i] = dto.AddressResponse{
			ID:          addr.ID,
			UserID:      addr.UserID,
			Name:        addr.Name,
			Phone:       addr.Phone,
			AddressLine: addr.AddressLine,
			City:        addr.City,
			State:       addr.State,
			Pincode:     addr.Pincode,
			Country:     addr.Country,
		}
	}

	c.JSON(http.StatusOK, response)
}

func (h *AddressHandler) UpdateAddress(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, dto.ErrorResponse{Error: "unauthorized"})
		return
	}

	addressIDStr := c.Param("id")
	addressID, err := strconv.ParseInt(addressIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "invalid address ID"})
		return
	}

	var req dto.AddressRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	addr, err := h.addressUC.UpdateAddress(addressID, userID.(int64), address.AddressInput{
		Name:        req.Name,
		Phone:       req.Phone,
		AddressLine: req.AddressLine,
		City:        req.City,
		State:       req.State,
		Pincode:     req.Pincode,
		Country:     req.Country,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.AddressResponse{
		ID:          addr.ID,
		UserID:      addr.UserID,
		Name:        addr.Name,
		Phone:       addr.Phone,
		AddressLine: addr.AddressLine,
		City:        addr.City,
		State:       addr.State,
		Pincode:     addr.Pincode,
		Country:     addr.Country,
	})
}

func (h *AddressHandler) DeleteAddress(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, dto.ErrorResponse{Error: "unauthorized"})
		return
	}

	addressIDStr := c.Param("id")
	addressID, err := strconv.ParseInt(addressIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "invalid address ID"})
		return
	}

	if err := h.addressUC.DeleteAddress(addressID, userID.(int64)); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.MessageResponse{Message: "Address deleted successfully"})
}
