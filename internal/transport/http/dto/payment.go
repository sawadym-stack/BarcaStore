package dto

type CreatePaymentRequest struct {
	OrderID    int64  `json:"order_id" binding:"required"`
	MockStatus string `json:"mock_status"` // "success" or "failed"
}

type CancelOrderItemRequest struct {
	OrderItemID int64 `json:"order_item_id" binding:"required"`
}

type PaymentResponse struct {
	ID            int64  `json:"id"`
	TransactionID string `json:"transaction_id"`
	Amount        int64  `json:"amount"`
	Currency      string `json:"currency"`
	Status        string `json:"status"`
}

type ReturnRequestInput struct {
	Reason  string `json:"reason" binding:"required"`
	Comment string `json:"comment"`
}

type AdminReturnCommentInput struct {
	Comment string `json:"comment"`
}
