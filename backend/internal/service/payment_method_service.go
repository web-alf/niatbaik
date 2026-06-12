package service

import (
	"github.com/anrdart/niatbaik-api/internal/dto/request"
	"github.com/anrdart/niatbaik-api/internal/model"
	"github.com/anrdart/niatbaik-api/internal/repository"
	"github.com/google/uuid"
)

type PaymentMethodService struct {
	repo *repository.PaymentMethodRepo
}

func NewPaymentMethodService(repo *repository.PaymentMethodRepo) *PaymentMethodService {
	return &PaymentMethodService{repo: repo}
}

func (s *PaymentMethodService) List() ([]model.PaymentMethod, error) {
	return s.repo.FindAll()
}

func (s *PaymentMethodService) Create(req *request.PaymentMethodInput) (*model.PaymentMethod, error) {
	pm := &model.PaymentMethod{
		BankName:      req.BankName,
		AccountName:   req.AccountName,
		BankNumber:    req.BankNumber,
		BankType:      req.BankType,
		Image:         req.Image,
		Type:          req.Type,
		Category:      req.Category,
		Code:          req.Code,
		AdminFee:      req.AdminFee,
		Active:        req.Active,
		GatewayConfig: req.GatewayConfig,
		IsDefault:     false,
	}
	if err := s.repo.Create(pm); err != nil {
		return nil, err
	}
	return pm, nil
}

func (s *PaymentMethodService) Update(id uuid.UUID, req *request.PaymentMethodInput) (*model.PaymentMethod, error) {
	pm, err := s.repo.FindByID(id)
	if err != nil {
		return nil, err
	}
	pm.BankName = req.BankName
	pm.AccountName = req.AccountName
	pm.BankNumber = req.BankNumber
	pm.BankType = req.BankType
	pm.Image = req.Image
	pm.Type = req.Type
	pm.Category = req.Category
	pm.Code = req.Code
	pm.AdminFee = req.AdminFee
	pm.Active = req.Active
	pm.GatewayConfig = req.GatewayConfig
	if err := s.repo.Update(pm); err != nil {
		return nil, err
	}
	return pm, nil
}

func (s *PaymentMethodService) Delete(id uuid.UUID) error {
	return s.repo.Delete(id)
}
