package jwt

import (
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

type Claims struct {
	jwt.RegisteredClaims
	UserID uuid.UUID `json:"user_id"`
	Email  string    `json:"email"`
	Role   string    `json:"role"`
}

func GenerateTokens(userID uuid.UUID, email, role, secret string, accessExpiry, refreshExpiry time.Duration) (accessToken, refreshToken string, err error) {
	accessToken, err = GenerateAccessToken(userID, email, role, secret, accessExpiry)
	if err != nil {
		return "", "", fmt.Errorf("generate access token: %w", err)
	}

	refreshToken, err = GenerateRefreshToken(userID, email, role, secret, refreshExpiry)
	if err != nil {
		return "", "", fmt.Errorf("generate refresh token: %w", err)
	}

	return accessToken, refreshToken, nil
}

func GenerateAccessToken(userID uuid.UUID, email, role, secret string, expiry time.Duration) (string, error) {
	claims := &Claims{
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(expiry)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Subject:   userID.String(),
		},
		UserID: userID,
		Email:  email,
		Role:   role,
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}

func GenerateRefreshToken(userID uuid.UUID, email, role, secret string, expiry time.Duration) (string, error) {
	claims := &Claims{
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(expiry)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Subject:   userID.String(),
		},
		UserID: userID,
		Email:  email,
		Role:   role,
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}

func ParseToken(tokenString, secret string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
		}
		return []byte(secret), nil
	})
	if err != nil {
		return nil, fmt.Errorf("parse token: %w", err)
	}

	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, fmt.Errorf("invalid token claims")
	}

	return claims, nil
}
