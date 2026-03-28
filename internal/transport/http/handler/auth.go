package handler

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/sawadym-stack/barca-store-clean/internal/domain/entities"
	"github.com/sawadym-stack/barca-store-clean/internal/transport/http/dto"
	"github.com/sawadym-stack/barca-store-clean/internal/usecase/order"
	"github.com/sawadym-stack/barca-store-clean/internal/usecase/user"
)

type AuthHandler struct {
	userUC  *user.Interactor
	orderUC *order.Interactor
}

func NewAuthHandler(userUC *user.Interactor, orderUC *order.Interactor) *AuthHandler {
	return &AuthHandler{
		userUC:  userUC,
		orderUC: orderUC,
	}
}

// Register creates a new user account
func (h *AuthHandler) Register(c *gin.Context) {
	var req dto.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	output, err := h.userUC.Register(user.RegisterInput{
		Email:    req.Email,
		Password: req.Password,
		Name:     req.Name,
	})
	if err != nil {
		c.JSON(http.StatusConflict, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Registration successful. Please verify your email with the OTP sent.",
		"user": dto.UserResponse{
			Email:  output.User.Email,
			Name:   output.User.Name,
			Status: "Pending Verification",
		},
	})
}

// Login authenticates a user
func (h *AuthHandler) Login(c *gin.Context) {
	var req dto.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	output, err := h.userUC.Login(user.LoginInput{
		Email:    req.Email,
		Password: req.Password,
	})
	if err != nil {
		c.JSON(http.StatusUnauthorized, dto.ErrorResponse{Error: err.Error()})
		return
	}

	status := "Active"
	if output.User.IsBlocked {
		status = "Suspended"
	}

	c.JSON(http.StatusOK, dto.AuthResponse{
		Token:        output.Token,
		RefreshToken: output.RefreshToken,
		User: dto.UserResponse{
			ID:           output.User.ID,
			Email:        output.User.Email,
			Name:         output.User.Name,
			Role:         string(output.User.Role),
			Status:       status,
			ProfilePhoto: output.User.ProfilePhoto,
			CreatedAt:    output.User.CreatedAt.Format(time.RFC3339),
		},
	})
}

// RefreshToken handles token refresh request
func (h *AuthHandler) RefreshToken(c *gin.Context) {
	var req dto.RefreshTokenRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	token, refreshToken, err := h.userUC.RefreshToken(req.RefreshToken)
	if err != nil {
		c.JSON(http.StatusUnauthorized, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"token":         token,
		"refresh_token": refreshToken,
	})
}

// VerifyOTP validates OTP code
func (h *AuthHandler) VerifyOTP(c *gin.Context) {
	var req dto.VerifyOTPRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	if err := h.userUC.VerifyOTP(user.VerifyOTPInput{
		Email: req.Email,
		Code:  req.Code,
	}); err != nil {
		c.JSON(http.StatusUnauthorized, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.MessageResponse{Message: "OTP verified successfully"})
}

// ForgotPassword initiates password reset
func (h *AuthHandler) ForgotPassword(c *gin.Context) {
	var req dto.ForgotPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	code, err := h.userUC.ForgotPassword(user.ForgotPasswordInput{
		Email: req.Email,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"code": code, "message": "Password reset code sent to email"})
}

// ResetPassword resets user password
func (h *AuthHandler) ResetPassword(c *gin.Context) {
	var req dto.ResetPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	if err := h.userUC.ResetPassword(user.ResetPasswordInput{
		Email:    req.Email,
		Code:     req.Code,
		Password: req.Password,
	}); err != nil {
		c.JSON(http.StatusUnauthorized, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.MessageResponse{Message: "Password reset successfully"})
}

// Logout authenticates a user
func (h *AuthHandler) Logout(c *gin.Context) {
	if err := h.userUC.Logout(); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.MessageResponse{Message: "Logged out successfully"})
}

// GetProfile retrieves user profile
func (h *AuthHandler) GetProfile(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, dto.ErrorResponse{Error: "user ID not found"})
		return
	}

	profile, err := h.userUC.GetProfile(userID.(int64))
	if err != nil {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.UserResponse{
		ID:           profile.ID,
		Email:        profile.Email,
		Name:         profile.Name,
		Role:         string(profile.Role),
		Status:       profile.Status,
		ProfilePhoto: profile.ProfilePhoto,
		CreatedAt:    profile.CreatedAt.Format(time.RFC3339),
	})
}

// UpdateProfile updates user profile
func (h *AuthHandler) UpdateProfile(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, dto.ErrorResponse{Error: "user ID not found"})
		return
	}

	var req dto.UpdateProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	updated, err := h.userUC.UpdateProfile(user.UpdateProfileInput{
		UserID: userID.(int64),
		Name:   req.Name,
		Email:  req.Email,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.UserResponse{
		ID:           updated.ID,
		Email:        updated.Email,
		Name:         updated.Name,
		Role:         string(updated.Role),
		Status:       updated.Status,
		ProfilePhoto: updated.ProfilePhoto,
		CreatedAt:    updated.CreatedAt.Format(time.RFC3339),
	})
}

// ListUsers lists all users (admin only)
func (h *AuthHandler) ListUsers(c *gin.Context) {
	limitStr := c.DefaultQuery("limit", "10")
	offsetStr := c.DefaultQuery("offset", "0")

	limit, _ := strconv.Atoi(limitStr)
	offset, _ := strconv.Atoi(offsetStr)

	if limit < 1 {
		limit = 10
	}
	if limit > 100 {
		limit = 100
	}
	if offset < 0 {
		offset = 0
	}

	users, err := h.userUC.ListUsers(limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	response := make([]dto.UserResponse, len(users))
	for i, u := range users {
		orderCount, _ := h.orderUC.GetOrderCountByUserID(u.ID)
		response[i] = dto.UserResponse{
			ID:           u.ID,
			Email:        u.Email,
			Name:         u.Name,
			Role:         string(u.Role),
			Status:       u.Status,
			ProfilePhoto: u.ProfilePhoto,
			OrderCount:   orderCount,
			CreatedAt:    u.CreatedAt.Format(time.RFC3339),
		}
	}

	c.JSON(http.StatusOK, response)
}

// BlockUser blocks a user (admin only)
func (h *AuthHandler) BlockUser(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "invalid user ID"})
		return
	}

	if err := h.userUC.BlockUser(id); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.MessageResponse{Message: "User blocked successfully"})
}

// UnblockUser unblocks a user (admin only)
func (h *AuthHandler) UnblockUser(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "invalid user ID"})
		return
	}

	if err := h.userUC.UnblockUser(id); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.MessageResponse{Message: "User unblocked successfully"})
}

// UpdateUserRole updates a user's role (super admin only)
func (h *AuthHandler) UpdateUserRole(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "invalid user ID"})
		return
	}

	var req dto.UpdateRoleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	if err := h.userUC.UpdateUserRole(id, entities.UserRole(req.Role)); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.MessageResponse{Message: "User role updated successfully"})
}

// UploadProfilePhoto handles user profile photo upload
func (h *AuthHandler) UploadProfilePhoto(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, dto.ErrorResponse{Error: "user ID not found"})
		return
	}

	file, err := c.FormFile("photo")
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "photo is required"})
		return
	}

	// Generate safe filename (using user ID)
	filename := strconv.FormatInt(userID.(int64), 10) + "_" + file.Filename
	filepath := "uploads/" + filename

	if err := c.SaveUploadedFile(file, filepath); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "failed to save photo"})
		return
	}

	// Make the path accessible via static route
	staticPath := "/uploads/" + filename
	updated, err := h.userUC.UpdateProfilePhoto(userID.(int64), staticPath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.UserResponse{
		ID:           updated.ID,
		Email:        updated.Email,
		Name:         updated.Name,
		Role:         string(updated.Role),
		Status:       updated.Status,
		ProfilePhoto: updated.ProfilePhoto,
	})
}

// RemoveProfilePhoto removes user profile photo
func (h *AuthHandler) RemoveProfilePhoto(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, dto.ErrorResponse{Error: "user ID not found"})
		return
	}

	updated, err := h.userUC.UpdateProfilePhoto(userID.(int64), "")
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.UserResponse{
		ID:           updated.ID,
		Email:        updated.Email,
		Name:         updated.Name,
		Role:         string(updated.Role),
		Status:       updated.Status,
		ProfilePhoto: updated.ProfilePhoto,
	})
}
