package user

import (
	"errors"
	"fmt"
	"time"
	"unicode"

	"github.com/sawadym-stack/barca-store-clean/internal/domain/entities"
	"github.com/sawadym-stack/barca-store-clean/internal/domain/ports"
	"github.com/sawadym-stack/barca-store-clean/pkg/jwt"
	"golang.org/x/crypto/bcrypt"
)

type Interactor struct {
	userRepo    ports.UserRepository
	otpRepo     ports.OTPRepository
	resetRepo   ports.PasswordResetRepository
	refreshRepo ports.RefreshTokenRepository
	pendingRepo ports.PendingRegistrationRepository
	jwtSvc      *jwt.Service
	otpSvc      ports.OTPService
	resetSvc    ports.PasswordResetService
}

func NewInteractor(
	userRepo ports.UserRepository,
	otpRepo ports.OTPRepository,
	resetRepo ports.PasswordResetRepository,
	refreshRepo ports.RefreshTokenRepository,
	pendingRepo ports.PendingRegistrationRepository,
	jwtSvc *jwt.Service,
	otpSvc ports.OTPService,
	resetSvc ports.PasswordResetService,
) *Interactor {
	return &Interactor{
		userRepo:    userRepo,
		otpRepo:     otpRepo,
		resetRepo:   resetRepo,
		refreshRepo: refreshRepo,
		pendingRepo: pendingRepo,
		jwtSvc:      jwtSvc,
		otpSvc:      otpSvc,
		resetSvc:    resetSvc,
	}
}

type RegisterInput struct {
	Email    string
	Password string
	Name     string
}

type LoginInput struct {
	Email    string
	Password string
}

type OTPInput struct {
	Email string
}

type VerifyOTPInput struct {
	Email string
	Code  string
}

type ForgotPasswordInput struct {
	Email string
}

type ResetPasswordInput struct {
	Email    string
	Code     string
	Password string
}

type UpdateProfileInput struct {
	UserID int64
	Name   string
	Email  string
}

type AuthOutput struct {
	Token        string
	RefreshToken string
	User         *entities.User
}

type UserResponse struct {
	ID           int64
	Email        string
	Name         string
	Role         entities.UserRole
	IsBlocked    bool
	Status       string
	ProfilePhoto string
	CreatedAt    time.Time
}

func validatePassword(password string) error {
	if len(password) < 8 {
		return errors.New("password must be at least 8 characters long")
	}
	var (
		hasUpper   = false
		hasLower   = false
		hasNumber  = false
		hasSpecial = false
	)
	for _, char := range password {
		switch {
		case unicode.IsUpper(char):
			hasUpper = true
		case unicode.IsLower(char):
			hasLower = true
		case unicode.IsNumber(char):
			hasNumber = true
		case unicode.IsPunct(char) || unicode.IsSymbol(char):
			hasSpecial = true
		}
	}
	if !hasUpper || !hasLower || !hasNumber || !hasSpecial {
		return errors.New("password must contain at least one uppercase letter, one lowercase letter, one number, and one special character")
	}
	return nil
}

// Register creates a new pending registration
func (i *Interactor) Register(input RegisterInput) (*AuthOutput, error) {
	if input.Email == "" || input.Password == "" || input.Name == "" {
		return nil, errors.New("email, password, and name are required")
	}

	if err := validatePassword(input.Password); err != nil {
		return nil, err
	}

	existingUser, _ := i.userRepo.FindByEmail(input.Email)
	if existingUser != nil {
		if existingUser.IsVerified {
			return nil, errors.New("email already registered and verified")
		}
		// If exists but not verified, we'll allow "re-registering" which effectively resends OTP
		fmt.Printf("ℹ️ User %s exists but is not verified. Resending OTP...\n", input.Email)
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	// Generate and send code via OTP service
	code, err := i.otpSvc.GenerateAndSend(input.Email)
	if err != nil {
		fmt.Printf("❌ Registration failed: could not send OTP to %s: %v\n", input.Email, err)
		return nil, err
	}

	fmt.Printf("📝 Storing pending registration for %s with code: %s\n", input.Email, code)

	pending := &entities.PendingRegistration{
		Email:     input.Email,
		Password:  string(hashedPassword),
		Name:      input.Name,
		Code:      code,
		ExpiresAt: time.Now().Add(30 * time.Minute),
	}

	if err := i.pendingRepo.Create(pending); err != nil {
		fmt.Printf("❌ Registration failed: could not save pending data for %s: %v\n", input.Email, err)
		return nil, err
	}

	return &AuthOutput{
		User: &entities.User{Email: input.Email, Name: input.Name},
	}, nil
}

// Login authenticates a user
func (i *Interactor) Login(input LoginInput) (*AuthOutput, error) {
	if input.Email == "" || input.Password == "" {
		return nil, errors.New("email and password are required")
	}

	user, err := i.userRepo.FindByEmail(input.Email)
	if err != nil || user == nil {
		return nil, errors.New("invalid credentials")
	}

	if user.IsBlocked {
		return nil, errors.New("account is blocked")
	}

	if !user.IsVerified {
		return nil, errors.New("please verify your email using OTP before logging in")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(input.Password)); err != nil {
		return nil, errors.New("invalid credentials")
	}

	token, err := i.jwtSvc.GenerateToken(user.ID, user.Email, string(user.Role))
	if err != nil {
		return nil, err
	}

	refreshToken, expiry, err := i.jwtSvc.GenerateRefreshToken()
	if err != nil {
		return nil, err
	}

	// Store refresh token in database
	rt := &entities.RefreshToken{
		UserID:    user.ID,
		Token:     refreshToken,
		ExpiresAt: expiry,
	}
	if err := i.refreshRepo.Create(rt); err != nil {
		return nil, err
	}

	return &AuthOutput{
		Token:        token,
		RefreshToken: refreshToken,
		User:         user,
	}, nil
}

func (i *Interactor) RefreshToken(token string) (string, string, error) {
	rt, err := i.refreshRepo.FindByToken(token)
	if err != nil {
		return "", "", errors.New("invalid or expired refresh token")
	}

	user, err := i.userRepo.FindByID(rt.UserID)
	if err != nil || user == nil {
		return "", "", errors.New("user not found")
	}

	if user.IsBlocked {
		return "", "", errors.New("account is blocked")
	}

	// Generate new tokens
	newToken, err := i.jwtSvc.GenerateToken(user.ID, user.Email, string(user.Role))
	if err != nil {
		return "", "", err
	}

	newRefreshToken, expiry, err := i.jwtSvc.GenerateRefreshToken()
	if err != nil {
		return "", "", err
	}

	// Revoke old token and save new one (rotation)
	if err := i.refreshRepo.RevokeByUserID(user.ID); err != nil {
		return "", "", err
	}

	newRt := &entities.RefreshToken{
		UserID:    user.ID,
		Token:     newRefreshToken,
		ExpiresAt: expiry,
	}
	if err := i.refreshRepo.Create(newRt); err != nil {
		return "", "", err
	}

	return newToken, newRefreshToken, nil
}

// SendOTP generates and sends an OTP to email
func (i *Interactor) SendOTP(input OTPInput) error {
	if input.Email == "" {
		return errors.New("email and OTP type are required")
	}

	_, err := i.otpSvc.GenerateAndSend(input.Email)
	return err
}

// VerifyOTP validates the OTP code and creates the user if pending
func (i *Interactor) VerifyOTP(input VerifyOTPInput) error {
	if input.Email == "" || input.Code == "" {
		return errors.New("email and code are required")
	}

	// 1. Check if it's a pending registration
	pending, err := i.pendingRepo.FindByEmailAndCode(input.Email, input.Code)
	if err == nil && pending != nil {
		// Valid pending registration!
		user := &entities.User{
			Email:      pending.Email,
			Password:   pending.Password,
			Name:       pending.Name,
			Role:       entities.RoleUser,
			IsVerified: true,
		}

		if err := i.userRepo.Create(user); err != nil {
			return err
		}

		// Cleanup pending
		return i.pendingRepo.DeleteByEmail(pending.Email)
	}

	// 2. Otherwise try standard OTP verification (e.g. for login or other flows)
	if err := i.otpSvc.VerifyOTP(input.Email, input.Code); err != nil {
		return err
	}

	return nil
}

// ForgotPassword initiates password reset process
func (i *Interactor) ForgotPassword(input ForgotPasswordInput) (string, error) {
	if input.Email == "" {
		return "", errors.New("email is required")
	}

	user, err := i.userRepo.FindByEmail(input.Email)
	if err != nil {
		return "", err
	}

	if user == nil {
		// For security, don't reveal if email exists
		return "", nil
	}

	code, err := i.resetSvc.GenerateAndSendCode(user.ID, user.Email)
	return code, err
}

// ResetPassword resets user password using 6-digit code
func (i *Interactor) ResetPassword(input ResetPasswordInput) error {
	fmt.Printf("\n\n!!!!! RESET ATTEMPT START !!!!!\n")
	if input.Email == "" || input.Code == "" || input.Password == "" {
		return errors.New("email, code and new password are required")
	}

	if err := validatePassword(input.Password); err != nil {
		return err
	}

	reset, err := i.resetSvc.VerifyCode(input.Email, input.Code)
	if err != nil {
		fmt.Printf("❌ VerifyToken error: %v\n", err)
		return err
	}
	fmt.Printf("✅ Token verified for User ID: %d\n", reset.UserID)

	user, err := i.userRepo.FindByID(reset.UserID)
	if err != nil || user == nil {
		fmt.Printf("❌ User not found for ID: %d\n", reset.UserID)
		return errors.New("user not found")
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		fmt.Printf("❌ Hashing error: %v\n", err)
		return err
	}

	fmt.Printf("🔄 Updating password in DB for User ID: %d\n", reset.UserID)

	user.Password = string(hashedPassword)
	if err := i.userRepo.Update(user); err != nil {
		fmt.Printf("❌ DB Update failed: %v\n", err)
		return err
	}

	fmt.Printf("✅ DB Update successful for User ID: %d\n", user.ID)

	// Mark reset token as used
	if err := i.resetSvc.MarkAsUsed(reset.ID); err != nil {
		fmt.Printf("⚠️ Failed to mark token as used: %v\n", err)
		return err
	}

	fmt.Printf("!!!!! RESET ATTEMPT SUCCESS !!!!!\n\n")
	return nil
}

// Logout performs user logout
func (i *Interactor) Logout() error {
	// For stateless JWT, logout is usually handled by client by deleting token.
	// You could implement token blacklisting here if needed.
	fmt.Println("👤 User logged out")
	return nil
}

// GetProfile retrieves user profile
func (i *Interactor) GetProfile(userID int64) (*UserResponse, error) {
	user, err := i.userRepo.FindByID(userID)
	if err != nil || user == nil {
		return nil, errors.New("user not found")
	}

	status := "Active"
	if user.IsBlocked {
		status = "Suspended"
	}

	return &UserResponse{
		ID:           user.ID,
		Email:        user.Email,
		Name:         user.Name,
		Role:         user.Role,
		IsBlocked:    user.IsBlocked,
		Status:       status,
		ProfilePhoto: user.ProfilePhoto,
		CreatedAt:    user.CreatedAt,
	}, nil
}

// UpdateProfile updates user information
func (i *Interactor) UpdateProfile(input UpdateProfileInput) (*UserResponse, error) {
	if input.UserID == 0 {
		return nil, errors.New("user ID is required")
	}

	user, err := i.userRepo.FindByID(input.UserID)
	if err != nil || user == nil {
		return nil, errors.New("user not found")
	}

	if input.Name != "" {
		user.Name = input.Name
	}

	if input.Email != "" && input.Email != user.Email {
		existing, _ := i.userRepo.FindByEmail(input.Email)
		if existing != nil {
			return nil, errors.New("email already in use")
		}
		user.Email = input.Email
	}

	if err := i.userRepo.Update(user); err != nil {
		return nil, err
	}

	status := "Active"
	if user.IsBlocked {
		status = "Suspended"
	}

	return &UserResponse{
		ID:           user.ID,
		Email:        user.Email,
		Name:         user.Name,
		Role:         user.Role,
		IsBlocked:    user.IsBlocked,
		Status:       status,
		ProfilePhoto: user.ProfilePhoto,
		CreatedAt:    user.CreatedAt,
	}, nil
}

// UpdateProfilePhoto updates user's profile photo path in DB, then returns the updated user.
func (i *Interactor) UpdateProfilePhoto(userID int64, photoPath string) (*UserResponse, error) {
	if userID <= 0 {
		return nil, errors.New("user ID is required")
	}

	if err := i.userRepo.UpdateProfilePhoto(userID, photoPath); err != nil {
		return nil, err
	}

	user, err := i.userRepo.FindByID(userID)
	if err != nil || user == nil {
		return nil, errors.New("user not found")
	}

	status := "Active"
	if user.IsBlocked {
		status = "Suspended"
	}

	return &UserResponse{
		ID:           user.ID,
		Email:        user.Email,
		Name:         user.Name,
		Role:         user.Role,
		IsBlocked:    user.IsBlocked,
		Status:       status,
		ProfilePhoto: user.ProfilePhoto,
		CreatedAt:    user.CreatedAt,
	}, nil
}

// GetUserByID retrieves user by ID
func (i *Interactor) GetUserByID(id int64) (*entities.User, error) {
	return i.userRepo.FindByID(id)
}

// ListUsers lists all users (admin only)
func (i *Interactor) ListUsers(limit, offset int) ([]*UserResponse, error) {
	users, err := i.userRepo.FindAll(limit, offset)
	if err != nil {
		return nil, err
	}

	var responses []*UserResponse
	for _, user := range users {
		status := "Active"
		if user.IsBlocked {
			status = "Suspended"
		}
		responses = append(responses, &UserResponse{
			ID:           user.ID,
			Email:        user.Email,
			Name:         user.Name,
			Role:         user.Role,
			IsBlocked:    user.IsBlocked,
			Status:       status,
			ProfilePhoto: user.ProfilePhoto,
			CreatedAt:    user.CreatedAt,
		})
	}

	return responses, nil
}

// BlockUser blocks a user account (admin only)
func (i *Interactor) BlockUser(userID int64) error {
	return i.userRepo.BlockUser(userID)
}

// UnblockUser unblocks a user account (admin only)
func (i *Interactor) UnblockUser(userID int64) error {
	return i.userRepo.UnblockUser(userID)
}

// UpdateUserRole updates a user's role (super admin only)
func (i *Interactor) UpdateUserRole(targetUserID int64, newRole entities.UserRole) error {
	targetUser, err := i.userRepo.FindByID(targetUserID)
	if err != nil || targetUser == nil {
		return errors.New("user not found")
	}

	// Constraint: Super Admin is immutable
	if targetUser.Role == entities.RoleSuperAdmin {
		return errors.New("cannot change the role of a super admin")
	}

	// Constraint: Only admin@gmail.com can be super admin (prevent creating new ones)
	if newRole == entities.RoleSuperAdmin {
		return errors.New("cannot promote user to super admin")
	}

	// Validation: only allow valid roles
	if newRole != entities.RoleAdmin && newRole != entities.RoleUser {
		return errors.New("invalid role")
	}

	return i.userRepo.UpdateRole(targetUserID, newRole)
}
