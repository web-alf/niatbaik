package service

import (
	"errors"

	"github.com/anrdart/niatbaik-api/internal/dto/request"
	"github.com/anrdart/niatbaik-api/internal/model"
	"github.com/anrdart/niatbaik-api/internal/repository"
	"github.com/anrdart/niatbaik-api/pkg/hash"
	"github.com/google/uuid"
)

type UserService struct {
	userRepo *repository.UserRepo
}

func NewUserService(userRepo *repository.UserRepo) *UserService {
	return &UserService{userRepo: userRepo}
}

func (s *UserService) Create(req *request.CreateUserRequest) (*model.User, error) {
	existing, _ := s.userRepo.FindByEmail(req.Email)
	if existing != nil {
		return nil, errors.New("email already registered")
	}

	hashed, err := hash.HashPassword(req.Password)
	if err != nil {
		return nil, err
	}

	u := model.User{
		Name:     req.Name,
		Email:    req.Email,
		Password: hashed,
		Role:     req.Role,
	}
	if req.Phone != "" {
		u.Phone = &req.Phone
	}

	if err := s.userRepo.Create(&u); err != nil {
		return nil, err
	}
	return &u, nil
}

func (s *UserService) Update(id uuid.UUID, req *request.UpdateUserRequest) (*model.User, error) {
	u, err := s.userRepo.FindByID(id)
	if err != nil {
		return nil, errors.New("user not found")
	}

	if req.Name != "" {
		u.Name = req.Name
	}
	if req.Email != "" {
		// check uniqueness
		existing, _ := s.userRepo.FindByEmail(req.Email)
		if existing != nil && existing.ID != u.ID {
			return nil, errors.New("email already in use")
		}
		u.Email = req.Email
	}
	if req.Phone != "" {
		u.Phone = &req.Phone
	}
	if req.Role != "" {
		u.Role = req.Role
	}
	if req.VerificationStatus != "" {
		u.VerificationStatus = req.VerificationStatus
	}

	if err := s.userRepo.Update(u); err != nil {
		return nil, err
	}
	return u, nil
}

func (s *UserService) Delete(id uuid.UUID) error {
	_, err := s.userRepo.FindByID(id)
	if err != nil {
		return errors.New("user not found")
	}
	return s.userRepo.Delete(id)
}
