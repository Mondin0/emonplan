package main

import (
	"bytes"
	"context"
	"image"
	"image/color"
	"image/png"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5"
)

type testPlanStore struct {
	contentType string
	content     []byte
}

func (s *testPlanStore) put(_ context.Context, id int64, typ string, data []byte) error {
	if id != 1 {
		return pgx.ErrNoRows
	}
	s.contentType, s.content = typ, data
	return nil
}
func (s *testPlanStore) get(_ context.Context, id int64) (string, []byte, error) {
	if id != 1 || s.content == nil {
		return "", nil, pgx.ErrNoRows
	}
	return s.contentType, s.content, nil
}
func TestPlanImageEndpoints(t *testing.T) {
	var imageBytes bytes.Buffer
	img := image.NewRGBA(image.Rect(0, 0, 1, 1))
	img.Set(0, 0, color.White)
	if err := png.Encode(&imageBytes, img); err != nil {
		t.Fatal(err)
	}
	store := &testPlanStore{}
	router := chi.NewRouter()
	registerPlanImages(router, store)
	request := func(method, path, typ string, body []byte) *httptest.ResponseRecorder {
		req := httptest.NewRequest(method, path, bytes.NewReader(body))
		req.Header.Set("Content-Type", typ)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)
		return w
	}
	path := "/api/projects/1/plan-image"
	if got := request("GET", path, "", nil).Code; got != 404 {
		t.Fatalf("missing image: %d", got)
	}
	for _, tc := range []struct {
		path, typ string
		data      []byte
		want      int
	}{
		{path, "image/jpeg", imageBytes.Bytes(), 400},
		{path, "image/png", []byte("not an image"), 400},
		{path, "image/svg+xml", imageBytes.Bytes(), 415},
		{path, "image/png", make([]byte, maxPlanImageSize+1), 413},
		{"/api/projects/2/plan-image", "image/png", imageBytes.Bytes(), 404},
		{path, "image/png", imageBytes.Bytes(), 204},
	} {
		if got := request("PUT", tc.path, tc.typ, tc.data).Code; got != tc.want {
			t.Errorf("PUT %s %s: got %d want %d", tc.path, tc.typ, got, tc.want)
		}
	}
	got := request("GET", path, "", nil)
	if got.Code != http.StatusOK || got.Header().Get("Content-Type") != "image/png" || got.Header().Get("Cache-Control") != "no-store" || !bytes.Equal(got.Body.Bytes(), imageBytes.Bytes()) {
		t.Fatal("image was not returned intact")
	}
}
