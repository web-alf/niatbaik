package service

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/anrdart/niatbaik-api/internal/repository"
)

// CekatAIService is a generic AI-CS proxy. The admin configures an OpenAI-compatible
// chat-completions endpoint + key + system prompt in Settings; this service calls it
// server-side so the key never reaches the browser. The donor CS flow is AI-first: it
// asks Cekat Ai, and on any failure (disabled, misconfigured, network, or an explicit
// "talk to a human" intent) the caller falls back to the human WhatsApp CS rotator.
type CekatAIService struct {
	settingRepo *repository.SettingRepo
}

func NewCekatAIService(settingRepo *repository.SettingRepo) *CekatAIService {
	return &CekatAIService{settingRepo: settingRepo}
}

// CekatChatMessage is one turn in the conversation (role: system|user|assistant).
type CekatChatMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

// CekatChatResult is what the proxy returns to the caller.
type CekatChatResult struct {
	Reply     string `json:"reply"`
	Handoff   bool   `json:"handoff"`   // true => caller should route to a human CS
	Model     string `json:"model"`
}

// Enabled reports whether Cekat Ai is turned on AND minimally configured.
func (s *CekatAIService) Enabled() bool {
	setting, err := s.settingRepo.Get()
	if err != nil || setting == nil {
		return false
	}
	return setting.CekatAIEnabled &&
		strings.TrimSpace(setting.CekatAIEndpoint) != "" &&
		strings.TrimSpace(setting.CekatAIKey) != ""
}

// wantsHuman detects an explicit request to talk to a person (Indonesian + English).
func wantsHuman(msg string) bool {
	m := strings.ToLower(msg)
	for _, kw := range []string{"manusia", "admin", "cs asli", "orang", "human", "agent", "operator", "bicara dengan"} {
		if strings.Contains(m, kw) {
			return true
		}
	}
	return false
}

// openAIChatResponse is the subset of the OpenAI-compatible response we read.
type openAIChatResponse struct {
	Choices []struct {
		Message struct {
			Content string `json:"content"`
		} `json:"message"`
	} `json:"choices"`
	Error *struct {
		Message string `json:"message"`
	} `json:"error"`
}

// Chat sends the donor's message (plus prior history) to the configured AI and returns
// the reply. Returns handoff=true (with no error) when the AI is unavailable or the
// donor asked for a human, so the caller can route to the WhatsApp CS rotator.
func (s *CekatAIService) Chat(history []CekatChatMessage, userMessage string) (*CekatChatResult, error) {
	setting, err := s.settingRepo.Get()
	if err != nil || setting == nil {
		return &CekatChatResult{Handoff: true}, nil
	}
	if !s.Enabled() {
		return &CekatChatResult{Handoff: true}, nil
	}
	if wantsHuman(userMessage) {
		return &CekatChatResult{Handoff: true, Reply: "Baik, saya sambungkan ke CS kami ya."}, nil
	}

	model := strings.TrimSpace(setting.CekatAIModel)
	if model == "" {
		model = "gpt-4o-mini"
	}
	systemPrompt := strings.TrimSpace(setting.CekatAISystemPrompt)
	if systemPrompt == "" {
		systemPrompt = "Anda adalah CS ramah untuk platform donasi NIATBAIK.ORG. Jawab singkat, sopan, bahasa Indonesia. Bantu donatur soal cara berdonasi, konfirmasi pembayaran, dan status donasi. Jika tidak yakin atau diminta bicara dengan manusia, arahkan untuk menunggu CS."
	}

	msgs := make([]CekatChatMessage, 0, len(history)+2)
	msgs = append(msgs, CekatChatMessage{Role: "system", Content: systemPrompt})
	msgs = append(msgs, history...)
	msgs = append(msgs, CekatChatMessage{Role: "user", Content: userMessage})

	body, err := json.Marshal(map[string]interface{}{
		"model":       model,
		"messages":    msgs,
		"temperature": 0.4,
		"max_tokens":  400,
	})
	if err != nil {
		return &CekatChatResult{Handoff: true}, nil
	}

	endpoint := strings.TrimRight(strings.TrimSpace(setting.CekatAIEndpoint), "/")
	// Accept either a full chat-completions URL or a base URL.
	if !strings.Contains(endpoint, "/chat/completions") && !strings.HasSuffix(endpoint, "/completions") {
		endpoint = endpoint + "/v1/chat/completions"
	}

	req, err := http.NewRequest("POST", endpoint, bytes.NewReader(body))
	if err != nil {
		return &CekatChatResult{Handoff: true}, nil
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+strings.TrimSpace(setting.CekatAIKey))

	client := &http.Client{Timeout: 25 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return &CekatChatResult{Handoff: true}, nil // network blip → human fallback
	}
	defer resp.Body.Close()
	respBody, _ := io.ReadAll(resp.Body)
	if resp.StatusCode >= 400 {
		return &CekatChatResult{Handoff: true}, nil
	}

	var parsed openAIChatResponse
	if err := json.Unmarshal(respBody, &parsed); err != nil || parsed.Error != nil || len(parsed.Choices) == 0 {
		return &CekatChatResult{Handoff: true}, nil
	}
	reply := strings.TrimSpace(parsed.Choices[0].Message.Content)
	if reply == "" {
		return &CekatChatResult{Handoff: true}, nil
	}
	return &CekatChatResult{Reply: reply, Model: model}, nil
}

// TestConnection sends a trivial ping so the admin dashboard can verify credentials.
func (s *CekatAIService) TestConnection() error {
	if !s.Enabled() {
		return fmt.Errorf("cekat ai belum aktif atau belum dikonfigurasi")
	}
	res, err := s.Chat(nil, "Halo, ini tes koneksi. Balas singkat 'OK'.")
	if err != nil {
		return err
	}
	if res.Handoff {
		return fmt.Errorf("cekat ai tidak merespons (cek endpoint/api key)")
	}
	return nil
}
