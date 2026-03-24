package handler

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/sawadym-stack/barca-store-clean/internal/domain/entities"
	"github.com/sawadym-stack/barca-store-clean/internal/usecase/coupon"
)

type CouponHandler struct {
	couponUC *coupon.Interactor
}

func NewCouponHandler(couponUC *coupon.Interactor) *CouponHandler {
	return &CouponHandler{
		couponUC: couponUC,
	}
}

func (h *CouponHandler) CreateCoupon(c *gin.Context) {
	var cp entities.Coupon
	if err := c.ShouldBindJSON(&cp); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.couponUC.CreateCoupon(&cp); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, cp)
}

func (h *CouponHandler) UpdateCoupon(c *gin.Context) {
	var cp entities.Coupon
	if err := c.ShouldBindJSON(&cp); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	idStr := c.Param("id")
	id, _ := strconv.ParseInt(idStr, 10, 64)
	cp.ID = id

	if err := h.couponUC.UpdateCoupon(&cp); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, cp)
}

func (h *CouponHandler) DeleteCoupon(c *gin.Context) {
	idStr := c.Param("id")
	id, _ := strconv.ParseInt(idStr, 10, 64)

	if err := h.couponUC.DeleteCoupon(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "coupon deleted"})
}

func (h *CouponHandler) ListCoupons(c *gin.Context) {
	coupons, err := h.couponUC.ListCoupons()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, coupons)
}

func (h *CouponHandler) ApplyCoupon(c *gin.Context) {
	var req struct {
		Code     string  `json:"code"`
		Subtotal float64 `json:"subtotal"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	coupon, discount, err := h.couponUC.ValidateAndApply(req.Code, req.Subtotal)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"coupon_code": coupon.Code,
		"discount":    discount,
		"total_price": req.Subtotal - discount,
	})
}
