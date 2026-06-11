package service

import "testing"

func TestValidCSContacts(t *testing.T) {
	valid := []string{
		"",                                       // empty clears the field
		"[]",                                     // empty array
		`[{"phone":"628123456","name":"CS A"}]`,  // 9-digit phone
		`[{"phone":"6281234567890"},{"phone":"08123456"}]`,
	}
	for _, s := range valid {
		if !validCSContacts(s) {
			t.Errorf("expected %q to be accepted", s)
		}
	}

	invalid := []string{
		"not json",
		`{"phone":"628123456"}`,        // object, not an array
		`[{"phone":"628123456"}`,        // truncated
		`[{"phone":"1"}]`,               // too short (<8 digits)
		`[{"phone":"1234567890123456"}]`, // too long (>15 digits)
		`[{"name":"no phone"}]`,         // missing phone
		`<script>alert(1)</script>`,
	}
	for _, s := range invalid {
		if validCSContacts(s) {
			t.Errorf("expected %q to be rejected", s)
		}
	}
}
