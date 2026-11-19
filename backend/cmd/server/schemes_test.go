package main

import (
	"encoding/json"
	"strings"
	"testing"
)

func TestSchemeRejectsUnknownTerminal(t *testing.T) {
	var s scheme
	err := json.Unmarshal([]byte(`{"name":"Taller","parts":[{"id":"a","kind":"lamp","x":0,"y":0}],"wires":[{"from":"a.L","to":"a.missing","kind":"Fase"}]}`), &s)
	if err != nil {
		t.Fatal(err)
	}
	if s.valid() {
		t.Fatal("accepted nonexistent terminal")
	}
	s.Wires = nil
	if !s.valid() {
		t.Fatal("rejected disconnected lamp")
	}
}

func TestSchemeNames(t *testing.T) {
	s := scheme{Name: strings.Repeat("室", 90)}
	if !s.valid() {
		t.Fatal("rejected valid multibyte name")
	}
	s.Name = "a\x00b"
	if s.valid() {
		t.Fatal("accepted null character")
	}
}
