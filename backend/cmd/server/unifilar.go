package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

var errUnifilarNotFound = errors.New("unifilar: obra inexistente")

type unifilarCircuit struct {
	ID          int64  `json:"id"`
	Identifier  string `json:"identifier"`
	Description string `json:"description"`
	Protection  string `json:"protection"`
}

type unifilarBoard struct {
	ID       int64             `json:"id"`
	Name     string            `json:"name"`
	Circuits []unifilarCircuit `json:"circuits"`
}

type unifilarProject struct {
	ID     int64           `json:"id"`
	Name   string          `json:"name"`
	Boards []unifilarBoard `json:"boards"`
}

type unifilarStore interface {
	get(context.Context, int64) (unifilarProject, error)
}

type unifilarDB struct{ db *pgxpool.Pool }

func (s unifilarDB) get(ctx context.Context, id int64) (unifilarProject, error) {
	var p unifilarProject
	p.Boards = []unifilarBoard{}
	err := s.db.QueryRow(ctx, `SELECT id,name FROM projects WHERE id=$1`, id).Scan(&p.ID, &p.Name)
	if errors.Is(err, pgx.ErrNoRows) {
		return p, errUnifilarNotFound
	}
	if err != nil {
		return p, err
	}
	rows, err := s.db.Query(ctx, `SELECT b.id,b.name,c.id,COALESCE(c.identifier,''),COALESCE(c.description,''),COALESCE(c.protection,'')
		FROM boards b LEFT JOIN circuits c ON c.board_id=b.id
		WHERE b.project_id=$1 ORDER BY b.id,c.id`, id)
	if err != nil {
		return p, err
	}
	defer rows.Close()
	for rows.Next() {
		var boardID int64
		var boardName string
		var circuitID sql.NullInt64
		var identifier, description, protection string
		if err := rows.Scan(&boardID, &boardName, &circuitID, &identifier, &description, &protection); err != nil {
			return p, err
		}
		if len(p.Boards) == 0 || p.Boards[len(p.Boards)-1].ID != boardID {
			p.Boards = append(p.Boards, unifilarBoard{ID: boardID, Name: boardName, Circuits: []unifilarCircuit{}})
		}
		if circuitID.Valid {
			board := &p.Boards[len(p.Boards)-1]
			board.Circuits = append(board.Circuits, unifilarCircuit{ID: circuitID.Int64, Identifier: identifier, Description: description, Protection: protection})
		}
	}
	return p, rows.Err()
}

func unifilarHandler(store unifilarStore) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
		if err != nil || id <= 0 {
			http.Error(w, "invalid id", http.StatusBadRequest)
			return
		}
		project, err := store.get(r.Context(), id)
		if errors.Is(err, errUnifilarNotFound) {
			http.NotFound(w, r)
			return
		}
		if err != nil {
			http.Error(w, "database error", http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(project)
	}
}

func registerUnifilar(r chi.Router, store unifilarStore) {
	r.Get("/api/projects/{id}/unifilar", unifilarHandler(store))
}
