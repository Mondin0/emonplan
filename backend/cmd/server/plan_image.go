package main

import (
	"bytes"
	"context"
	"errors"
	"image"
	_ "image/jpeg"
	_ "image/png"
	"io"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

const maxPlanImageSize = 10 << 20

type planImageStore interface {
	get(context.Context, int64) (string, []byte, error)
	put(context.Context, int64, string, []byte) error
}

type planImageDB struct{ db *pgxpool.Pool }

func (s planImageDB) get(ctx context.Context, id int64) (string, []byte, error) {
	var contentType string
	var content []byte
	err := s.db.QueryRow(ctx, `SELECT content_type, content FROM project_plan_images WHERE project_id=$1`, id).Scan(&contentType, &content)
	return contentType, content, err
}

func (s planImageDB) put(ctx context.Context, id int64, contentType string, content []byte) error {
	var savedID int64
	return s.db.QueryRow(ctx, `INSERT INTO project_plan_images(project_id,content_type,content)
		SELECT id,$2,$3 FROM projects WHERE id=$1
		ON CONFLICT (project_id) DO UPDATE SET content_type=EXCLUDED.content_type, content=EXCLUDED.content
		RETURNING project_id`, id, contentType, content).Scan(&savedID)
}

func registerPlanImages(r chi.Router, store planImageStore) {
	path := "/api/projects/{id}/plan-image"
	r.Get(path, func(w http.ResponseWriter, r *http.Request) {
		id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
		if err != nil || id <= 0 {
			http.Error(w, "invalid id", http.StatusBadRequest)
			return
		}
		contentType, content, err := store.get(r.Context(), id)
		if errors.Is(err, pgx.ErrNoRows) {
			http.NotFound(w, r)
			return
		}
		if err != nil {
			http.Error(w, "database error", http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", contentType)
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("Cache-Control", "no-store")
		w.Write(content)
	})
	r.Put(path, func(w http.ResponseWriter, r *http.Request) {
		id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
		if err != nil || id <= 0 {
			http.Error(w, "invalid id", http.StatusBadRequest)
			return
		}
		contentType := r.Header.Get("Content-Type")
		if contentType != "image/png" && contentType != "image/jpeg" {
			http.Error(w, "PNG or JPEG required", http.StatusUnsupportedMediaType)
			return
		}
		content, err := io.ReadAll(http.MaxBytesReader(w, r.Body, maxPlanImageSize))
		if err != nil {
			var tooLarge *http.MaxBytesError
			if errors.As(err, &tooLarge) {
				http.Error(w, "image too large", http.StatusRequestEntityTooLarge)
			} else {
				http.Error(w, "invalid body", http.StatusBadRequest)
			}
			return
		}
		if !validPlanImage(content, contentType) {
			http.Error(w, "invalid image", http.StatusBadRequest)
			return
		}
		err = store.put(r.Context(), id, contentType, content)
		if errors.Is(err, pgx.ErrNoRows) {
			http.NotFound(w, r)
			return
		}
		if err != nil {
			http.Error(w, "database error", http.StatusInternalServerError)
			return
		}
		w.WriteHeader(http.StatusNoContent)
	})
}

func validPlanImage(content []byte, contentType string) bool {
	config, format, err := image.DecodeConfig(bytes.NewReader(content))
	if err != nil || config.Width <= 0 || config.Height <= 0 || int64(config.Width)*int64(config.Height) > 40000000 || "image/"+format != contentType {
		return false
	}
	_, _, err = image.Decode(bytes.NewReader(content))
	return err == nil
}
