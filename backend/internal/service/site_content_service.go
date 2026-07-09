package service

import (
	"encoding/json"
	"errors"
	"fmt"

	"github.com/anrdart/niatbaik-api/internal/repository"
)

type SiteContentService struct {
	repo *repository.SiteContentRepo
}

func NewSiteContentService(repo *repository.SiteContentRepo) *SiteContentService {
	return &SiteContentService{repo: repo}
}

// AllowedKeys is the server-side allowlist of editable homepage sections. A PUT to any
// other key is rejected (defence in depth against the admin form writing junk). Keep in
// sync with the frontend section consumers + the default seed below.
var AllowedKeys = map[string]bool{
	"navbar":       true,
	"hero":         true,
	"trust_strip":  true,
	"how_to":       true,
	"testimonials": true,
	"faq":          true,
	"final_cta":    true,
	"footer":       true,
}

// PublicMap returns key → parsed JSON for the public endpoint (so the SPA receives ready
// objects, not raw strings). Missing keys are omitted; the frontend falls back to its
// built-in defaults.
func (s *SiteContentService) PublicMap() (map[string]json.RawMessage, error) {
	rows, err := s.repo.GetAll()
	if err != nil {
		return nil, err
	}
	out := make(map[string]json.RawMessage, len(rows))
	for _, r := range rows {
		if !AllowedKeys[r.Key] {
			continue
		}
		// Validate it parses; skip a corrupt blob rather than 500 the homepage.
		var probe any
		if err := json.Unmarshal([]byte(r.Value), &probe); err != nil {
			continue
		}
		out[r.Key] = json.RawMessage(r.Value)
	}
	return out, nil
}

// UpdateSection validates the key + that the body is valid JSON, then upserts.
func (s *SiteContentService) UpdateSection(key string, body any) error {
	if !AllowedKeys[key] {
		return fmt.Errorf("unknown section: %s", key)
	}
	raw, err := json.Marshal(body)
	if err != nil {
		return errors.New("invalid content payload")
	}
	return s.repo.Upsert(key, string(raw))
}
