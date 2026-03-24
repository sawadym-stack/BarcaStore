package handler

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/sawadym-stack/barca-store-clean/internal/transport/http/dto"
	"github.com/sawadym-stack/barca-store-clean/internal/usecase/payment"
)

type PaymentHandler struct {
	paymentUC *payment.Interactor
}

func NewPaymentHandler(paymentUC *payment.Interactor) *PaymentHandler {
	return &PaymentHandler{
		paymentUC: paymentUC,
	}
}

func (h *PaymentHandler) CreatePayment(c *gin.Context) {
	var req dto.CreatePaymentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	res, err := h.paymentUC.CreatePaymentOrder(req.OrderID, req.MockStatus)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.PaymentResponse{
		ID:            res.ID,
		TransactionID: res.TransactionID,
		Amount:        res.Amount,
		Currency:      res.Currency,
		Status:        string(res.PaymentStatus),
	})
}

func (h *PaymentHandler) CancelOrderItem(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "invalid item ID"})
		return
	}

	if err := h.paymentUC.CancelOrderItem(id); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.MessageResponse{Message: "Item cancelled successfully"})
}

func (h *PaymentHandler) CancelOrder(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "invalid order ID"})
		return
	}
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, dto.ErrorResponse{Error: "unauthorized"})
		return
	}

	if err := h.paymentUC.CancelOrder(id, userID.(int64)); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.MessageResponse{Message: "Order cancelled successfully"})
}

func (h *PaymentHandler) GetInvoice(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "invalid order ID"})
		return
	}

	pdfBytes, err := h.paymentUC.GeneratePDFInvoice(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.Header("Content-Type", "application/pdf")
	c.Header("Content-Disposition", `attachment; filename="invoice.pdf"`)
	c.Header("Content-Length", strconv.Itoa(len(pdfBytes)))
	c.Writer.Write(pdfBytes)
}

func (h *PaymentHandler) AdminRefundOrder(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "invalid order ID"})
		return
	}

	if err := h.paymentUC.ProcessAdminRefund(id); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.MessageResponse{Message: "Refund processed successfully"})
}

func (h *PaymentHandler) ReturnOrderItem(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "invalid item ID"})
		return
	}
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, dto.ErrorResponse{Error: "unauthorized"})
		return
	}

	var req dto.ReturnRequestInput
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	if err := h.paymentUC.ReturnOrderItem(id, userID.(int64), req.Reason, req.Comment); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.MessageResponse{Message: "Item returned successfully"})
}

func (h *PaymentHandler) AdminRefundOrderItem(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "invalid item ID"})
		return
	}

	item, err := h.paymentUC.GetOrderItemByID(id)
	if err != nil || item == nil {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "item not found"})
		return
	}

	payment, _ := h.paymentUC.GetPaymentByOrderID(item.OrderID)
	if payment == nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "payment not found"})
		return
	}

	refundAmount := int64(item.Price * float64(item.Quantity) * 100)
	if err := h.paymentUC.ProcessRefund(payment.ID, &item.ID, refundAmount); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.MessageResponse{Message: "Item refunded successfully"})
}

func (h *PaymentHandler) ApproveReturnOrderItem(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "invalid item ID"})
		return
	}

	var req dto.AdminReturnCommentInput
	c.ShouldBindJSON(&req) // Ignore errors as it's optional

	if err := h.paymentUC.ApproveReturnItem(id, req.Comment); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.MessageResponse{Message: "Return request approved"})
}

func (h *PaymentHandler) RejectReturnOrderItem(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "invalid item ID"})
		return
	}

	var req dto.AdminReturnCommentInput
	c.ShouldBindJSON(&req) 

	if err := h.paymentUC.RejectReturnItem(id, req.Comment); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.MessageResponse{Message: "Return request rejected"})
}
