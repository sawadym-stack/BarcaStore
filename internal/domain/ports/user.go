package ports

import "github.com/sawadym-stack/barca-store-clean/internal/domain/entities"

type UserRepository interface {
	Create(user *entities.User) error
	FindByEmail(email string) (*entities.User, error)
	FindByID(id int64) (*entities.User, error)
	Update(user *entities.User) error
	UpdateProfilePhoto(userID int64, photoPath string) error
	Delete(id int64) error
	FindAll(limit, offset int) ([]*entities.User, error)
	BlockUser(id int64) error
	UnblockUser(id int64) error
	UpdateRole(userID int64, newRole entities.UserRole) error
}

// Used for reading user data (login, profile, validation)
// type UserReader interface {
// 	FindByEmail(email string) (*entities.User, error)
// 	FindByID(id int64) (*entities.User, error)
// }

// // Used for modifying user data (register, update, delete)
// type UserWriter interface {
// 	Create(user *entities.User) error
// 	Update(user *entities.User) error
// 	Delete(id int64) error
// }

// // Used only for admin operations
// type UserAdmin interface {
// 	FindAll(limit, offset int) ([]*entities.User, error)
// 	BlockUser(id int64) error
// 	UnblockUser(id int64) error
// }

type OTPRepository interface {
	Create(otp *entities.OTP) error
	FindByEmailAndType(email string) (*entities.OTP, error)
	MarkAsUsed(id int64) error
	DeleteExpired() error
}

type PendingRegistrationRepository interface {
	Create(pending *entities.PendingRegistration) error
	FindByEmailAndCode(email, code string) (*entities.PendingRegistration, error)
	DeleteByEmail(email string) error
	DeleteExpired() error
}

type PasswordResetRepository interface {
	Create(reset *entities.PasswordReset) error
	FindByToken(token string) (*entities.PasswordReset, error)
	MarkAsUsed(id int64) error
	DeleteExpired() error
}

type RefreshTokenRepository interface {
	Create(token *entities.RefreshToken) error
	FindByToken(token string) (*entities.RefreshToken, error)
	RevokeByUserID(userID int64) error
	DeleteExpired() error
}

type ReviewRepository interface {
	Create(review *entities.Review) error
	Update(review *entities.Review) error
	Delete(id int64) error
	FindByID(id int64) (*entities.Review, error)
	FindByProductID(productID int64) ([]*entities.ReviewWithUser, error)
	GetAverageRating(productID int64) (float64, error)
	RateProduct(rating *entities.ProductRating) error
	GetProductRatings(productID int64) (likes, dislikes int, err error)
	FindByUserAndProduct(userID, productID int64) (*entities.Review, error)
}

type DashboardRepository interface {
	GetTotalUsers() (int64, error)
	GetTotalOrders() (int64, error)
	GetTotalSales() (float64, error)
	GetPendingOrders() (int64, error)
	GetCancelledOrders() (int64, error)
}

type EmailProvider interface {
	SendOTP(email, code string) error
	SendPasswordReset(email, token string) error
}

type OTPService interface {
	GenerateAndSend(email string) (string, error)
	VerifyOTP(email, code string) error
}

type PasswordResetService interface {
	GenerateAndSendCode(userID int64, email string) (string, error)
	VerifyCode(email, code string) (*entities.PasswordReset, error)
	MarkAsUsed(id int64) error
}
