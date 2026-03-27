package router

import (
	"github.com/gin-gonic/gin"
	"github.com/sawadym-stack/barca-store-clean/internal/domain/ports"
	"github.com/sawadym-stack/barca-store-clean/internal/middleware"
	"github.com/sawadym-stack/barca-store-clean/internal/transport/http/handler"
	addressuc "github.com/sawadym-stack/barca-store-clean/internal/usecase/address"
	cartuc "github.com/sawadym-stack/barca-store-clean/internal/usecase/cart"
	couponuc "github.com/sawadym-stack/barca-store-clean/internal/usecase/coupon"
	dashboarduc "github.com/sawadym-stack/barca-store-clean/internal/usecase/dashboard"
	orderuc "github.com/sawadym-stack/barca-store-clean/internal/usecase/order"
	paymentuc "github.com/sawadym-stack/barca-store-clean/internal/usecase/payment"
	"github.com/sawadym-stack/barca-store-clean/internal/usecase/product"
	reviewuc "github.com/sawadym-stack/barca-store-clean/internal/usecase/review"
	"github.com/sawadym-stack/barca-store-clean/internal/usecase/user"
	"github.com/sawadym-stack/barca-store-clean/pkg/jwt"
)

func NewRouter(userUC *user.Interactor, productUC *product.Interactor, cartUC *cartuc.Interactor, orderUC *orderuc.Interactor, paymentUC *paymentuc.Interactor, reviewUC *reviewuc.Interactor, dashboardUC *dashboarduc.Interactor, couponUC *couponuc.Interactor, addressUC *addressuc.Interactor, jwtSvc *jwt.Service, userRepo ports.UserRepository) *gin.Engine {
	router := gin.Default()

	authHandler := handler.NewAuthHandler(userUC, orderUC)
	productHandler := handler.NewProductHandler(productUC)
	cartHandler := handler.NewCartHandler(cartUC)
	wishlistHandler := handler.NewWishlistHandler(cartUC)
	orderHandler := handler.NewOrderHandler(orderUC, cartUC)
	reviewHandler := handler.NewReviewHandler(reviewUC)
	dashboardHandler := handler.NewDashboardHandler(dashboardUC)
	paymentHandler := handler.NewPaymentHandler(paymentUC)
	couponHandler := handler.NewCouponHandler(couponUC)
	addressHandler := handler.NewAddressHandler(addressUC)

	// Apply CORS Middleware
	router.Use(middleware.CORSMiddleware())

	// Serve static files for profile photos
	router.Static("/uploads", "./uploads")

	// Public routes - Authentication
	auth := router.Group("/api/auth")
	{
		auth.POST("/register", authHandler.Register)
		auth.POST("/login", authHandler.Login)

		auth.POST("/verify-otp", authHandler.VerifyOTP)
		auth.POST("/forgot-password", authHandler.ForgotPassword)
		auth.POST("/reset-password", authHandler.ResetPassword)
		auth.POST("/refresh", authHandler.RefreshToken)
	}

	// Public routes - Products
	products := router.Group("/api/products")
	{
		products.GET("", productHandler.ListProducts)
		products.GET("/category", productHandler.ListByCategory)
		products.GET("/search", productHandler.SearchProducts)
		products.GET("/:id", productHandler.GetProduct)
		products.GET("/:id/reviews", reviewHandler.GetProductReviews)
	}

	// Coupons public
	router.GET("/api/coupons", couponHandler.ListCoupons)
	router.POST("/api/coupons/apply", couponHandler.ApplyCoupon)

	// Reviews public group
	reviews := router.Group("/api/reviews")
	{
		reviews.GET("/:id", reviewHandler.GetProductReviews)
	}

	// Protected routes - User Profile, Cart & Wishlist
	protected := router.Group("/api")
	protected.Use(middleware.AuthMiddleware(jwtSvc, userRepo))
	{
		// User profile
		protected.GET("/user/profile", authHandler.GetProfile)
		protected.PUT("/user/profile", authHandler.UpdateProfile)
		protected.POST("/user/profile-photo", authHandler.UploadProfilePhoto)
		protected.POST("/auth/logout", authHandler.Logout)

		// Address routes
		protected.GET("/user/addresses", addressHandler.GetUserAddresses)
		protected.POST("/user/addresses", addressHandler.AddAddress)
		protected.PUT("/user/addresses/:id", addressHandler.UpdateAddress)
		protected.DELETE("/user/addresses/:id", addressHandler.DeleteAddress)

		// Cart routes
		protected.GET("/cart", cartHandler.GetCart)
		protected.POST("/cart", cartHandler.AddToCart)
		protected.PUT("/cart/:id", cartHandler.UpdateCartItem)
		protected.DELETE("/cart/:id", cartHandler.RemoveFromCart)
		protected.POST("/cart/clear", cartHandler.ClearCart)
		protected.GET("/cart/summary", cartHandler.GetCartSummary)

		// Order routes
		protected.POST("/orders", orderHandler.CreateOrder)
		protected.POST("/orders/checkout", orderHandler.Checkout)
		protected.GET("/orders", orderHandler.GetUserOrders)
		protected.POST("/orders/:id/cancel", paymentHandler.CancelOrder)
		protected.POST("/orders/items/:id/cancel", paymentHandler.CancelOrderItem)
		protected.POST("/orders/items/:id/return", paymentHandler.ReturnOrderItem)
		protected.GET("/orders/:id/invoice", paymentHandler.GetInvoice)

		// Payment routes
		protected.POST("/payments/create", paymentHandler.CreatePayment)

		// Wishlist routes
		protected.GET("/wishlist", wishlistHandler.GetWishlist)
		protected.POST("/wishlist", wishlistHandler.AddToWishlist)
		protected.DELETE("/wishlist/:product_id", wishlistHandler.RemoveFromWishlist)
		protected.GET("/wishlist/:product_id/check", wishlistHandler.IsInWishlist)

		// Review routes
		protected.POST("/reviews/:id", reviewHandler.AddReview)
		protected.GET("/reviews/:id/my", reviewHandler.GetMyReview)
		protected.PUT("/reviews/:id", reviewHandler.UpdateReview)
		protected.DELETE("/reviews/:id", reviewHandler.DeleteReview)
		protected.POST("/reviews/:id/rate", reviewHandler.RateProduct)

		// Status check
		protected.GET("/status", func(c *gin.Context) {
			c.JSON(200, gin.H{"status": "ok", "message": "API is running"})
		})
	}

	// Admin routes
	admin := router.Group("/api/admin")
	admin.Use(middleware.AuthMiddleware(jwtSvc, userRepo))
	admin.Use(middleware.AdminMiddleware())
	{
		// User management
		admin.GET("/users", authHandler.ListUsers)
		admin.PUT("/users/:id/block", authHandler.BlockUser)
		admin.PUT("/users/:id/unblock", authHandler.UnblockUser)

		// Super Admin restricted routes
		superAdmin := admin.Group("")
		superAdmin.Use(middleware.SuperAdminMiddleware())
		{
			superAdmin.PUT("/users/:id/role", authHandler.UpdateUserRole)
		}

		// Product management
		admin.POST("/products", productHandler.CreateProduct)
		admin.PUT("/products/:id", productHandler.UpdateProduct)
		admin.DELETE("/products/:id", productHandler.DeleteProduct)
		admin.PUT("/products/:id/stock", productHandler.UpdateStock)

		// Order management
		admin.GET("/orders", orderHandler.ListAllOrders)
		admin.PUT("/orders/:id/status", orderHandler.UpdateOrderStatus)
		admin.PUT("/orders/:id/payment-status", orderHandler.UpdatePaymentStatus)
		admin.POST("/orders/:id/refund", paymentHandler.AdminRefundOrder)
		admin.POST("/orders/items/:id/refund", paymentHandler.AdminRefundOrderItem)
		admin.POST("/orders/items/:id/return/approve", paymentHandler.ApproveReturnOrderItem)
		admin.POST("/orders/items/:id/return/reject", paymentHandler.RejectReturnOrderItem)

		// Dashboard metrics
		admin.GET("/dashboard/metrics", dashboardHandler.GetMetrics)

		// Coupon management
		admin.GET("/coupons", couponHandler.ListCoupons)
		admin.POST("/coupons", couponHandler.CreateCoupon)
		admin.PUT("/coupons/:id", couponHandler.UpdateCoupon)
		admin.DELETE("/coupons/:id", couponHandler.DeleteCoupon)
	}

	return router
}
