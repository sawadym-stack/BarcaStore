package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/sawadym-stack/barca-store-clean/internal/domain/entities"
	"github.com/sawadym-stack/barca-store-clean/internal/domain/ports"
	"github.com/sawadym-stack/barca-store-clean/internal/transport/http/dto"
	"github.com/sawadym-stack/barca-store-clean/pkg/jwt"
)

func AuthMiddleware(jwtSvc *jwt.Service, userRepo ports.UserRepository) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, dto.ErrorResponse{Error: "missing authorization header"})
			c.Abort()
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, dto.ErrorResponse{Error: "invalid authorization header"})
			c.Abort()
			return
		}

		claims, err := jwtSvc.VerifyToken(parts[1])
		if err != nil {
			c.JSON(http.StatusUnauthorized, dto.ErrorResponse{Error: "invalid token"})
			c.Abort()
			return
		}

		user, err := userRepo.FindByID(claims.UserID)
		if err != nil || user == nil {
			c.JSON(http.StatusUnauthorized, dto.ErrorResponse{Error: "user not found"})
			c.Abort()
			return
		}

		if user.IsBlocked {
			c.JSON(http.StatusUnauthorized, dto.ErrorResponse{Error: "account is blocked"})
			c.Abort()
			return
		}

		c.Set("user_id", claims.UserID)
		c.Set("email", claims.Email)
		c.Set("role", entities.UserRole(claims.Role))
		c.Next()
	}
}

func AdminMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		userRole, exists := c.Get("role")
		if !exists {
			c.JSON(http.StatusForbidden, dto.ErrorResponse{Error: "role information missing"})
			c.Abort()
			return
		}

		role, ok := userRole.(entities.UserRole)
		if !ok || (role != entities.RoleAdmin && role != entities.RoleSuperAdmin) {
			c.JSON(http.StatusForbidden, dto.ErrorResponse{Error: "admin access required"})
			c.Abort()
			return
		}

		c.Next()
	}
}

func SuperAdminMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		userRole, exists := c.Get("role")
		if !exists {
			c.JSON(http.StatusForbidden, dto.ErrorResponse{Error: "role information missing"})
			c.Abort()
			return
		}

		if role, ok := userRole.(entities.UserRole); !ok || role != entities.RoleSuperAdmin {
			c.JSON(http.StatusForbidden, dto.ErrorResponse{Error: "super admin access required"})
			c.Abort()
			return
		}

		c.Next()
	}
}
