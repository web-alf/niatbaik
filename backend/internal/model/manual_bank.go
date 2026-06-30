package model

import (
	"encoding/json"
	"strconv"
	"strings"
)

// ManualBank is one structured manual-transfer destination an admin configures and a
// donor picks from a dropdown on the public donation form.
type ManualBank struct {
	BankName      string `json:"bank_name"`
	AccountNumber string `json:"account_number"`
	AccountName   string `json:"account_name"`
	Logo          string `json:"logo"`
}

// ParseManualBanks reads Setting.ManualBanks into the structured list. Current shape is
// an array of objects; for backward compatibility it also accepts the legacy flat array
// of label strings (["Bank BCA",…]), upgrading each to point at the single org account
// (s.BankNumber / s.BankAccountName). Falls back to a single entry from the org account
// when no list is configured. Shared by the public method list and donation creation so
// both agree on the donor-facing options and their indices ("manual-bank-N").
func ParseManualBanks(s *Setting) []ManualBank {
	cfg := strings.TrimSpace(s.ManualBanks)
	if cfg != "" {
		var structured []ManualBank
		if err := json.Unmarshal([]byte(cfg), &structured); err == nil && len(structured) > 0 && structured[0].BankName != "" {
			out := make([]ManualBank, 0, len(structured))
			for _, b := range structured {
				name := strings.TrimSpace(b.BankName)
				num := strings.TrimSpace(b.AccountNumber)
				if name == "" || num == "" {
					continue
				}
				out = append(out, ManualBank{BankName: name, AccountNumber: num, AccountName: strings.TrimSpace(b.AccountName), Logo: b.Logo})
			}
			if len(out) > 0 {
				return out
			}
		}
		var labels []string
		if err := json.Unmarshal([]byte(cfg), &labels); err == nil {
			out := make([]ManualBank, 0, len(labels))
			for _, l := range labels {
				if name := strings.TrimSpace(l); name != "" {
					out = append(out, ManualBank{BankName: name, AccountNumber: s.BankNumber, AccountName: s.BankAccountName})
				}
			}
			if len(out) > 0 {
				return out
			}
		}
	}
	if s.BankNumber != "" {
		name := s.BankName
		if name == "" {
			name = "Transfer Bank"
		}
		return []ManualBank{{BankName: name, AccountNumber: s.BankNumber, AccountName: s.BankAccountName}}
	}
	return nil
}

// ManualBankBySyntheticID resolves a "manual-bank-N" synthetic id to the configured
// account at index N. Returns nil when the id isn't a manual-bank id or N is out of range.
func ManualBankBySyntheticID(s *Setting, syntheticID string) *ManualBank {
	id := strings.ToLower(strings.TrimSpace(syntheticID))
	if !strings.HasPrefix(id, "manual-bank-") {
		return nil
	}
	idx, err := strconv.Atoi(strings.TrimPrefix(id, "manual-bank-"))
	if err != nil || idx < 0 {
		return nil
	}
	banks := ParseManualBanks(s)
	if idx >= len(banks) {
		return nil
	}
	return &banks[idx]
}
