package main

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"regexp"
	"slices"
	"strconv"
	"strings"
	"unicode/utf8"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type schemePart struct {
	ID   string  `json:"id"`
	Kind string  `json:"kind"`
	X    float64 `json:"x"`
	Y    float64 `json:"y"`
	On   bool    `json:"on"`
}
type schemeWire struct {
	From string `json:"from"`
	To   string `json:"to"`
	Kind string `json:"kind"`
}
type scheme struct {
	Name    string       `json:"name"`
	Voltage *float64     `json:"voltage"`
	Parts   []schemePart `json:"parts"`
	Wires   []schemeWire `json:"wires"`
}

var pinNames = map[string][]string{"source": {"L", "N", "PE"}, "lamp": {"L", "N", "PE"}, "simple": {"C", "1"}, "change": {"C", "1", "2"}, "box": {"J1", "J2", "J3"}}
var partID = regexp.MustCompile(`^[a-zA-Z0-9_-]{1,64}$`)

func (s scheme) valid() bool {
	if strings.TrimSpace(s.Name) == "" || utf8.RuneCountInString(s.Name) > 100 || strings.ContainsRune(s.Name, 0) || (s.Voltage != nil && *s.Voltage <= 0) {
		return false
	}
	pins := map[string]bool{}
	ids := map[string]bool{}
	source := false
	for _, p := range s.Parts {
		if !partID.MatchString(p.ID) || ids[p.ID] || pinNames[p.Kind] == nil {
			return false
		}
		if p.Kind == "source" {
			if source {
				return false
			}
			source = true
		}
		ids[p.ID] = true
		for _, pin := range pinNames[p.Kind] {
			pins[p.ID+"."+pin] = true
		}
	}
	pairs := map[[2]string]bool{}
	for _, w := range s.Wires {
		if !pins[w.From] || !pins[w.To] || w.From == w.To || !slices.Contains([]string{"Fase", "Neutro", "Tierra", "Retorno", "Viajero"}, w.Kind) {
			return false
		}
		if pairs[[2]string{w.From, w.To}] || pairs[[2]string{w.To, w.From}] {
			return false
		}
		pairs[[2]string{w.From, w.To}] = true
	}
	return true
}

func readSchemes(ctx context.Context, db *pgxpool.Pool, project, id int64) (json.RawMessage, error) {
	var result json.RawMessage
	var err error
	if id == 0 {
		err = db.QueryRow(ctx, `SELECT COALESCE((SELECT jsonb_agg(jsonb_build_object('id',id,'name',drawing->>'name') ORDER BY id) FROM wiring_schemes WHERE project_id=$1),'[]') FROM projects WHERE id=$1`, project).Scan(&result)
	} else {
		err = db.QueryRow(ctx, "SELECT drawing FROM wiring_schemes WHERE project_id=$1 AND id=$2", project, id).Scan(&result)
	}
	return result, err
}

func saveScheme(ctx context.Context, db *pgxpool.Pool, project, id int64, drawing []byte) (json.RawMessage, error) {
	var result json.RawMessage
	var err error
	if id == 0 {
		err = db.QueryRow(ctx, `INSERT INTO wiring_schemes(project_id,drawing) SELECT id,$2 FROM projects WHERE id=$1 RETURNING jsonb_build_object('id',id)`, project, drawing).Scan(&result)
	} else {
		err = db.QueryRow(ctx, `UPDATE wiring_schemes SET drawing=$3 WHERE project_id=$1 AND id=$2 RETURNING jsonb_build_object('id',id)`, project, id, drawing).Scan(&result)
	}
	return result, err
}

func registerSchemes(r chi.Router, db *pgxpool.Pool) {
	handle := func(w http.ResponseWriter, r *http.Request) {
		project, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
		if err != nil || project <= 0 {
			http.Error(w, "Obra inválida", 400)
			return
		}
		var id int64
		if token := chi.URLParam(r, "scheme"); token != "" {
			id, err = strconv.ParseInt(token, 10, 64)
			if err != nil || id <= 0 {
				http.Error(w, "Esquema inválido", 400)
				return
			}
		}
		ctx := r.Context()
		var result json.RawMessage
		if r.Method == "GET" {
			result, err = readSchemes(ctx, db, project, id)
		} else {
			var s scheme
			dec := json.NewDecoder(http.MaxBytesReader(w, r.Body, 1<<20))
			dec.DisallowUnknownFields()
			if dec.Decode(&s) != nil || dec.Decode(&struct{}{}) != io.EOF || !s.valid() || s.Parts == nil || s.Wires == nil {
				http.Error(w, "Revisá el nombre, la tensión y los bornes del esquema.", 400)
				return
			}
			drawing, _ := json.Marshal(s)
			result, err = saveScheme(ctx, db, project, id, drawing)
		}
		if errors.Is(err, pgx.ErrNoRows) {
			http.NotFound(w, r)
			return
		}
		if err != nil {
			http.Error(w, "Error de base de datos", 500)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.Write(result)
	}
	const path = "/api/projects/{id}/schemes"
	r.Get(path, handle)
	r.Post(path, handle)
	r.Get(path+"/{scheme}", handle)
	r.Put(path+"/{scheme}", handle)
}
