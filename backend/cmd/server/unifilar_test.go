package main

import (
	"context"
	"encoding/json"
	"errors"
	"net/http/httptest"
	"reflect"
	"testing"

	"github.com/go-chi/chi/v5"
)

type fakeUnifilar struct {
	project unifilarProject
	err     error
}

func (f fakeUnifilar) get(context.Context, int64) (unifilarProject, error) {
	return f.project, f.err
}

func newUnifilarTestServer(store unifilarStore) *chi.Mux {
	r := chi.NewRouter()
	r.Get("/api/projects/{id}/unifilar", unifilarHandler(store))
	return r
}

// U5: la API distingue ID inválido (400) de obra inexistente (404).
func TestUnifilarHandlerRejectsInvalidAndUnknownIDs(t *testing.T) {
	r := newUnifilarTestServer(fakeUnifilar{err: errUnifilarNotFound})
	for _, tc := range []struct {
		url  string
		want int
	}{
		{"/api/projects/abc/unifilar", 400},
		{"/api/projects/0/unifilar", 400},
		{"/api/projects/-3/unifilar", 400},
		{"/api/projects/999999/unifilar", 404},
	} {
		rec := httptest.NewRecorder()
		r.ServeHTTP(rec, httptest.NewRequest("GET", tc.url, nil))
		if rec.Code != tc.want {
			t.Errorf("%s: got %d, want %d", tc.url, rec.Code, tc.want)
		}
	}
}

// U3/U4: la respuesta separa tableros y circuitos, usa IDs y permite tableros sin circuitos.
func TestUnifilarHandlerReturnsProjectWithBoards(t *testing.T) {
	want := unifilarProject{
		ID:   7,
		Name: "Taller Sur",
		Boards: []unifilarBoard{
			{ID: 11, Name: "Tablero de máquinas", Circuits: []unifilarCircuit{{ID: 21, Identifier: "C1", Description: "Torno", Protection: "10 A"}}},
			{ID: 12, Name: "Tablero de reserva", Circuits: []unifilarCircuit{}},
		},
	}
	r := newUnifilarTestServer(fakeUnifilar{project: want})
	rec := httptest.NewRecorder()
	r.ServeHTTP(rec, httptest.NewRequest("GET", "/api/projects/7/unifilar", nil))
	if rec.Code != 200 {
		t.Fatalf("got %d: %s", rec.Code, rec.Body.String())
	}
	if got := rec.Header().Get("Content-Type"); got != "application/json" {
		t.Errorf("content type %q", got)
	}
	var got unifilarProject
	if err := json.Unmarshal(rec.Body.Bytes(), &got); err != nil {
		t.Fatal(err)
	}
	if !reflect.DeepEqual(got, want) {
		t.Errorf("got %+v, want %+v", got, want)
	}
}

// U5: un error de lectura se traduce en 500, no en 404 ni en datos vacíos.
func TestUnifilarHandlerSurfacesStoreErrors(t *testing.T) {
	r := newUnifilarTestServer(fakeUnifilar{err: errors.New("boom")})
	rec := httptest.NewRecorder()
	r.ServeHTTP(rec, httptest.NewRequest("GET", "/api/projects/7/unifilar", nil))
	if rec.Code != 500 {
		t.Errorf("got %d, want 500", rec.Code)
	}
}
