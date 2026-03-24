package main

import (
	"log"
	"os"

	"github.com/joho/godotenv"
	"github.com/sawadym-stack/barca-store-clean/internal/migration"
	"github.com/sawadym-stack/barca-store-clean/internal/repository/postgres"
	"github.com/sawadym-stack/barca-store-clean/internal/service"
	router "github.com/sawadym-stack/barca-store-clean/internal/transport/http/router"
	addressuc "github.com/sawadym-stack/barca-store-clean/internal/usecase/address"
	cartuc "github.com/sawadym-stack/barca-store-clean/internal/usecase/cart"
	couponuc "github.com/sawadym-stack/barca-store-clean/internal/usecase/coupon"
	dashboarduc "github.com/sawadym-stack/barca-store-clean/internal/usecase/dashboard"
	orderuc "github.com/sawadym-stack/barca-store-clean/internal/usecase/order"
	paymentuc "github.com/sawadym-stack/barca-store-clean/internal/usecase/payment"
	productuc "github.com/sawadym-stack/barca-store-clean/internal/usecase/product"
	reviewuc "github.com/sawadym-stack/barca-store-clean/internal/usecase/review"
	useruc "github.com/sawadym-stack/barca-store-clean/internal/usecase/user"
	"github.com/sawadym-stack/barca-store-clean/pkg/config"
	pg "github.com/sawadym-stack/barca-store-clean/pkg/db"
	"github.com/sawadym-stack/barca-store-clean/pkg/email"
	"github.com/sawadym-stack/barca-store-clean/pkg/jwt"
)

func main() {

	godotenv.Load()
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("config: %v", err)
	}

	db, err := pg.NewGorm(cfg)
	if err != nil {
		log.Fatalf("db: %v", err)
	}

	if err := migration.RunAutoMigrate(db); err != nil {
		log.Fatalf("migrate: %v", err)
	}

	// Initialize services
	jwtSvc := jwt.New(cfg.JWTSecret, cfg.JWTExpiration, cfg.RefreshTokenExpiration)
	emailProvider := email.NewSMTPProvider(cfg.SMTPHost, cfg.SMTPPort, cfg.SMTPUser, cfg.SMTPPassword, cfg.SMTPSender)

	// Initialize repositories
	userRepo := postgres.NewUserRepo(db)
	otpRepo := postgres.NewOTPRepo(db)
	resetRepo := postgres.NewPasswordResetRepo(db)
	refreshRepo := postgres.NewRefreshTokenRepo(db)
	pendingRepo := postgres.NewPendingRegistrationRepo(db)
	productRepo := postgres.NewProductRepo(db)
	cartRepo := postgres.NewCartRepo(db)
	cartItemRepo := postgres.NewCartItemRepo(db)
	wishlistRepo := postgres.NewWishlistRepo(db)
	orderRepo := postgres.NewOrderRepo(db)
	reviewRepo := postgres.NewReviewRepo(db)
	dashboardRepo := postgres.NewDashboardRepo(db)
	paymentRepo := postgres.NewPaymentRepo(db)
	invoiceRepo := postgres.NewInvoiceRepo(db)
	refundRepo := postgres.NewRefundRepo(db)
	couponRepo := postgres.NewCouponRepo(db)
	addressRepo := postgres.NewAddressRepo(db)

	// Initialize business logic services
	otpSvc := service.NewOTPService(otpRepo, emailProvider, 10)               // 10 minutes expiry
	resetSvc := service.NewPasswordResetService(resetRepo, emailProvider, 30) // 30 minutes expiry

	// Initialize use cases
	userUC := useruc.NewInteractor(userRepo, otpRepo, resetRepo, refreshRepo, pendingRepo, jwtSvc, otpSvc, resetSvc)
	productUC := productuc.NewInteractor(productRepo)
	cartUC := cartuc.NewInteractor(cartRepo, cartItemRepo, wishlistRepo, productRepo)
	orderUC := orderuc.NewInteractor(orderRepo, productRepo, couponRepo, paymentRepo)
	reviewUC := reviewuc.NewInteractor(reviewRepo, productRepo, orderRepo)
	dashboardUC := dashboarduc.NewInteractor(dashboardRepo)
	paymentUC := paymentuc.NewInteractor(paymentRepo, orderRepo, invoiceRepo, refundRepo, userRepo, productRepo)
	couponUC := couponuc.NewInteractor(couponRepo)
	addressUC := addressuc.NewInteractor(addressRepo)

	// Setup router and start server
	r := router.NewRouter(userUC, productUC, cartUC, orderUC, paymentUC, reviewUC, dashboardUC, couponUC, addressUC, jwtSvc, userRepo)

	port := os.Getenv("SERVER_PORT")
	if port == "" {
		port = cfg.ServerPort
	}

	log.Printf("🚀 Server starting on port %s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("server: %v", err)
	}
}
