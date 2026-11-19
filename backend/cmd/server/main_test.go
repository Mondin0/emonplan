package main

import (
	"encoding/json"
	"net/http/httptest"
	"testing"
)

func TestValidFields(t *testing.T) {
	for _, tc := range []struct {
		fields map[string]any
		want   bool
	}{
		{map[string]any{"name": "Tablero"}, true},
		{map[string]any{"name": "  "}, false},
		{map[string]any{"identifier": 123}, false},
		{map[string]any{"description": "Circuito"}, true},
		{map[string]any{"supplier": "Electricidad Centro"}, true},
		{map[string]any{"supplier": ""}, true},
		{map[string]any{"supplier": json.Number("123")}, false},
		{map[string]any{"supplier": nil}, false},
		{map[string]any{"supplier": true}, false},
		{map[string]any{"supplier": map[string]any{}}, false},
	} {
		if got := validFields(tc.fields); got != tc.want {
			t.Errorf("validFields(%v) = %v", tc.fields, got)
		}
	}
}
func TestValidOrigin(t *testing.T) {
	req := httptest.NewRequest("POST", "http://localhost:8080/api/login", nil)
	for _, tc := range []struct {
		origin string
		want   bool
	}{{"http://localhost:8080", true}, {"http://evil.example", false}, {"", false}} {
		req.Header.Set("Origin", tc.origin)
		if got := validOrigin(req); got != tc.want {
			t.Errorf("origin %q got %v", tc.origin, got)
		}
	}
}
func TestRequiredFields(t *testing.T) {
	if requiredFields("clients", map[string]any{}) {
		t.Fatal("missing name accepted")
	}
	if requiredFields("clients", map[string]any{"name": " "}) {
		t.Fatal("blank name accepted")
	}
	if !requiredFields("clients", map[string]any{"name": "Ada"}) {
		t.Fatal("valid name rejected")
	}
}
