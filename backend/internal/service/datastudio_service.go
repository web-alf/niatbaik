package service

import (
	"github.com/anrdart/niatbaik-api/internal/dto/response"
	"github.com/anrdart/niatbaik-api/internal/repository"
)

type DataStudioService struct {
	repo *repository.DataStudioRepo
}

func NewDataStudioService(repo *repository.DataStudioRepo) *DataStudioService {
	return &DataStudioService{repo: repo}
}

func (s *DataStudioService) GetOverview() (*response.DSOverview, error) {
	return s.repo.GetOverview()
}

func (s *DataStudioService) GetFunnel() ([]response.DSFunnelStep, error) {
	return s.repo.GetFunnel()
}

func (s *DataStudioService) GetPlatform(platform string) (*response.DSPlatform, error) {
	return s.repo.GetPlatform(platform)
}

func (s *DataStudioService) GetGeo() ([]response.DSGeoEntry, error) {
	return s.repo.GetGeo()
}
