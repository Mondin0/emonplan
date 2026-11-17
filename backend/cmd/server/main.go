package main

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/phpdave11/gofpdf"
	"golang.org/x/crypto/bcrypt"
)

func main() {
	ctx := context.Background()
	db, err := pgxpool.New(ctx, os.Getenv("DATABASE_URL"))
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()
	if err = migrate(ctx, db); err != nil {
		log.Fatal(err)
	}
	var exists bool
	if err = db.QueryRow(ctx, "SELECT EXISTS(SELECT 1 FROM owner)").Scan(&exists); err != nil {
		log.Fatal(err)
	}
	if !exists {
		email, password := os.Getenv("OWNER_EMAIL"), os.Getenv("OWNER_PASSWORD")
		if email == "" || len(password) < 12 {
			log.Fatal("OWNER_EMAIL and OWNER_PASSWORD (at least 12 characters) required")
		}
		hash, e := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
		if e != nil {
			log.Fatal(e)
		}
		if _, e = db.Exec(ctx, "INSERT INTO owner(email,password_hash) VALUES($1,$2)", email, string(hash)); e != nil {
			log.Fatal(e)
		}
	}
	r := chi.NewRouter()
	r.Get("/api/health", func(w http.ResponseWriter, r *http.Request) {
		if db.Ping(r.Context()) != nil {
			http.Error(w, "database unavailable", 503)
			return
		}
		w.Write([]byte("ok"))
	})
	r.Post("/api/login", func(w http.ResponseWriter, r *http.Request) {
		if !validOrigin(r) {
			http.Error(w, "invalid origin", 403)
			return
		}
		var v struct {
			Email    string `json:"email"`
			Password string `json:"password"`
		}
		if json.NewDecoder(http.MaxBytesReader(w, r.Body, 4096)).Decode(&v) != nil {
			http.Error(w, "invalid request", 400)
			return
		}
		var hash string
		e := db.QueryRow(r.Context(), "SELECT password_hash FROM owner WHERE email=$1", v.Email).Scan(&hash)
		if e != nil || bcrypt.CompareHashAndPassword([]byte(hash), []byte(v.Password)) != nil {
			http.Error(w, "invalid credentials", 401)
			return
		}
		b := make([]byte, 32)
		if _, e = rand.Read(b); e != nil {
			http.Error(w, "server error", 500)
			return
		}
		token := hex.EncodeToString(b)
		h := sha256.Sum256([]byte(token))
		if _, e = db.Exec(r.Context(), "INSERT INTO sessions(token_hash,expires_at) VALUES($1,now()+interval '24 hours')", h[:]); e != nil {
			http.Error(w, "server error", 500)
			return
		}
		http.SetCookie(w, &http.Cookie{Name: "session", Value: token, Path: "/", HttpOnly: true, Secure: os.Getenv("SESSION_SECURE") == "true", SameSite: http.SameSiteStrictMode, MaxAge: 86400})
		w.WriteHeader(204)
	})
	r.Group(func(r chi.Router) {
		r.Use(func(next http.Handler) http.Handler {
			return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				c, e := r.Cookie("session")
				if e != nil {
					http.Error(w, "unauthorized", 401)
					return
				}
				h := sha256.Sum256([]byte(c.Value))
				var ok bool
				e = db.QueryRow(r.Context(), "SELECT EXISTS(SELECT 1 FROM sessions WHERE token_hash=$1 AND expires_at>now())", h[:]).Scan(&ok)
				if e != nil || !ok {
					http.Error(w, "unauthorized", 401)
					return
				}
				if r.Method != "GET" && r.Method != "HEAD" {
					origin := r.Header.Get("Origin")
					if origin == "" || (!strings.EqualFold(origin, "http://"+r.Host) && !strings.EqualFold(origin, "https://"+r.Host)) {
						http.Error(w, "invalid origin", 403)
						return
					}
				}
				next.ServeHTTP(w, r)
			})
		})
		registerResources(r, db)
		registerPlanImages(r, planImageDB{db})
		registerQuotations(r, db)
		r.Get("/api/me", func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte(`{"authenticated":true}`))
		})
		r.Post("/api/logout", func(w http.ResponseWriter, r *http.Request) {
			c, _ := r.Cookie("session")
			h := sha256.Sum256([]byte(c.Value))
			db.Exec(r.Context(), "DELETE FROM sessions WHERE token_hash=$1", h[:])
			http.SetCookie(w, &http.Cookie{Name: "session", Path: "/", HttpOnly: true, MaxAge: -1, SameSite: http.SameSiteStrictMode})
			w.WriteHeader(204)
		})
	})
	server := http.Server{Addr: ":8080", Handler: r, ReadHeaderTimeout: 5 * time.Second}
	log.Fatal(server.ListenAndServe())
}

var resources = map[string][]string{
	"clients":           {"name", "email", "phone", "address"},
	"projects":          {"client_id", "name", "address", "description", "installation_type", "supply_type", "status"},
	"boards":            {"project_id", "name"},
	"circuits":          {"board_id", "identifier", "description", "circuit_type", "power_w", "voltage_v", "protection", "conductor_mm2", "length_m"},
	"materials":         {"name", "category", "unit", "price_cents"},
	"project-materials": {"project_id", "material_id", "quantity"},
	"activities":        {"project_id", "description", "observation", "occurred_on"},
}

func registerResources(r chi.Router, db *pgxpool.Pool) {
	for resource, fields := range resources {
		table := strings.ReplaceAll(resource, "-", "_")
		allowed := map[string]bool{}
		for _, f := range fields {
			allowed[f] = true
		}
		path := "/api/" + resource
		r.Get(path, func(w http.ResponseWriter, r *http.Request) {
			rows, err := db.Query(r.Context(), "SELECT row_to_json(t) FROM (SELECT * FROM "+table+" ORDER BY id) t")
			if err != nil {
				http.Error(w, "database error", 500)
				return
			}
			defer rows.Close()
			out := []json.RawMessage{}
			for rows.Next() {
				var v []byte
				if rows.Scan(&v) != nil {
					http.Error(w, "database error", 500)
					return
				}
				out = append(out, v)
			}
			if rows.Err() != nil {
				http.Error(w, "database error", 500)
				return
			}
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(out)
		})
		save := func(w http.ResponseWriter, r *http.Request) {
			var body map[string]any
			d := json.NewDecoder(http.MaxBytesReader(w, r.Body, 32768))
			d.UseNumber()
			if d.Decode(&body) != nil || len(body) == 0 || !validFields(body) || (r.Method == "POST" && !requiredFields(resource, body)) {
				http.Error(w, "invalid body", 400)
				return
			}
			keys := make([]string, 0, len(body))
			for k := range body {
				if !allowed[k] {
					http.Error(w, "unknown field", 400)
					return
				}
				keys = append(keys, k)
			}
			sort.Strings(keys)
			args := make([]any, 0, len(keys)+1)
			parts := make([]string, 0, len(keys))
			for i, k := range keys {
				v := body[k]
				if n, ok := v.(json.Number); ok {
					v = n.String()
				}
				args = append(args, v)
				parts = append(parts, fmt.Sprintf("%s=$%d", k, i+1))
			}
			var query string
			if r.Method == "POST" {
				place := make([]string, len(keys))
				for i := range keys {
					place[i] = fmt.Sprintf("$%d", i+1)
				}
				query = "INSERT INTO " + table + " (" + strings.Join(keys, ",") + ") VALUES (" + strings.Join(place, ",") + ") RETURNING id"
			} else {
				id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
				if err != nil {
					http.Error(w, "invalid id", 400)
					return
				}
				args = append(args, id)
				query = "UPDATE " + table + " SET " + strings.Join(parts, ",") + fmt.Sprintf(" WHERE id=$%d RETURNING id", len(args))
			}
			var id int64
			if err := db.QueryRow(r.Context(), query, args...).Scan(&id); err != nil {
				http.Error(w, "invalid data or conflicting record", 400)
				return
			}
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]int64{"id": id})
		}
		r.Post(path, save)
		r.Put(path+"/{id}", save)
		r.Delete(path+"/{id}", func(w http.ResponseWriter, r *http.Request) {
			id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
			if err != nil {
				http.Error(w, "invalid id", 400)
				return
			}
			tag, err := db.Exec(r.Context(), "DELETE FROM "+table+" WHERE id=$1", id)
			if err != nil {
				http.Error(w, "record is in use", 409)
				return
			}
			if tag.RowsAffected() == 0 {
				http.NotFound(w, r)
				return
			}
			w.WriteHeader(204)
		})
	}
}

func registerQuotations(r chi.Router, db *pgxpool.Pool) {
	r.Get("/api/quotations/{id}/pdf", func(w http.ResponseWriter, r *http.Request) {
		id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
		if err != nil {
			http.Error(w, "invalid id", 400)
			return
		}
		var project string
		var version int
		var labor int64
		err = db.QueryRow(r.Context(), `SELECT p.name,q.version,q.labor_cents FROM quotations q JOIN projects p ON p.id=q.project_id WHERE q.id=$1`, id).Scan(&project, &version, &labor)
		if err != nil {
			http.NotFound(w, r)
			return
		}
		rows, err := db.Query(r.Context(), `SELECT name,unit,quantity::text,price_cents,total_cents FROM quotation_items WHERE quotation_id=$1 ORDER BY id`, id)
		if err != nil {
			http.Error(w, "database error", 500)
			return
		}
		defer rows.Close()
		pdf := gofpdf.New("P", "mm", "A4", "")
		pdf.AddPage()
		pdf.SetFont("Arial", "B", 16)
		tr := pdf.UnicodeTranslatorFromDescriptor("")
		pdf.Cell(0, 10, tr(fmt.Sprintf("Presupuesto #%d - versión %d", id, version)))
		pdf.Ln(12)
		pdf.SetFont("Arial", "", 11)
		pdf.Cell(0, 8, tr("Proyecto: "+project))
		pdf.Ln(10)
		var total int64
		for rows.Next() {
			var name, unit, qty string
			var price, line int64
			if rows.Scan(&name, &unit, &qty, &price, &line) != nil {
				http.Error(w, "database error", 500)
				return
			}
			total += line
			pdf.MultiCell(0, 7, tr(fmt.Sprintf("%s | %s %s | $%d,%02d | $%d,%02d", name, qty, unit, price/100, price%100, line/100, line%100)), "", "", false)
		}
		if rows.Err() != nil {
			http.Error(w, "database error", 500)
			return
		}
		total += labor
		pdf.Ln(5)
		pdf.Cell(0, 8, fmt.Sprintf("Mano de obra: $%d,%02d", labor/100, labor%100))
		pdf.Ln(8)
		pdf.SetFont("Arial", "B", 12)
		pdf.Cell(0, 8, fmt.Sprintf("Total: $%d,%02d", total/100, total%100))
		w.Header().Set("Content-Type", "application/pdf")
		w.Header().Set("Content-Disposition", fmt.Sprintf("inline; filename=presupuesto-%d.pdf", id))
		if err = pdf.Output(w); err != nil {
			log.Printf("pdf: %v", err)
		}
	})

	r.Get("/api/quotations", func(w http.ResponseWriter, r *http.Request) {
		rows, err := db.Query(r.Context(), `SELECT row_to_json(t) FROM (SELECT q.*, COALESCE((SELECT sum(total_cents) FROM quotation_items WHERE quotation_id=q.id),0)+q.labor_cents AS total_cents FROM quotations q ORDER BY q.id) t`)
		if err != nil {
			http.Error(w, "database error", 500)
			return
		}
		defer rows.Close()
		out := []json.RawMessage{}
		for rows.Next() {
			var b []byte
			if rows.Scan(&b) != nil {
				http.Error(w, "database error", 500)
				return
			}
			out = append(out, b)
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(out)
	})
	r.Post("/api/quotations", func(w http.ResponseWriter, r *http.Request) {
		var v struct {
			ProjectID  int64 `json:"project_id"`
			LaborCents int64 `json:"labor_cents"`
		}
		if json.NewDecoder(http.MaxBytesReader(w, r.Body, 4096)).Decode(&v) != nil || v.ProjectID <= 0 || v.LaborCents < 0 {
			http.Error(w, "invalid data", 400)
			return
		}
		tx, err := db.Begin(r.Context())
		if err != nil {
			http.Error(w, "database error", 500)
			return
		}
		defer tx.Rollback(r.Context())
		var id int64
		err = tx.QueryRow(r.Context(), `INSERT INTO quotations(project_id,version,labor_cents) SELECT $1,COALESCE(MAX(version),0)+1,$2 FROM quotations WHERE project_id=$1 RETURNING id`, v.ProjectID, v.LaborCents).Scan(&id)
		if err == nil {
			_, err = tx.Exec(r.Context(), `INSERT INTO quotation_items(quotation_id,name,unit,quantity,price_cents,total_cents) SELECT $1,m.name,m.unit,pm.quantity,m.price_cents,round(pm.quantity*m.price_cents)::bigint FROM project_materials pm JOIN materials m ON m.id=pm.material_id WHERE pm.project_id=$2`, id, v.ProjectID)
		}
		if err != nil {
			http.Error(w, "invalid project or data", 400)
			return
		}
		if tx.Commit(r.Context()) != nil {
			http.Error(w, "database error", 500)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]int64{"id": id})
	})
}

// validFields rejects blank identifiers and names at the HTTP trust boundary.
func validFields(body map[string]any) bool {
	for _, key := range []string{"name", "identifier", "unit", "protection"} {
		if value, ok := body[key]; ok {
			s, ok := value.(string)
			if !ok || strings.TrimSpace(s) == "" {
				return false
			}
		}
	}
	return true
}
func validOrigin(r *http.Request) bool {
	origin := r.Header.Get("Origin")
	return strings.EqualFold(origin, "http://"+r.Host) || strings.EqualFold(origin, "https://"+r.Host)
}

func requiredFields(resource string, body map[string]any) bool {
	required := map[string][]string{
		"clients": {"name"}, "projects": {"name", "client_id"}, "boards": {"name", "project_id"},
		"circuits":  {"board_id", "identifier", "power_w", "voltage_v", "protection", "conductor_mm2", "length_m"},
		"materials": {"name", "unit", "price_cents"}, "project-materials": {"project_id", "material_id", "quantity"},
		"activities": {"project_id", "description", "occurred_on"},
	}
	for _, field := range required[resource] {
		v, ok := body[field]
		if !ok || v == nil {
			return false
		}
		if x, ok := v.(string); ok && strings.TrimSpace(x) == "" {
			return false
		}
	}
	return true
}

func migrate(ctx context.Context, db *pgxpool.Pool) error {
	tx, err := db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)
	if _, err = tx.Exec(ctx, `SELECT pg_advisory_xact_lock(1735426)`); err != nil {
		return err
	}
	if _, err = tx.Exec(ctx, `CREATE TABLE IF NOT EXISTS schema_migrations (version text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())`); err != nil {
		return err
	}
	entries, err := os.ReadDir("migrations")
	if err != nil {
		return err
	}
	for _, entry := range entries {
		if entry.IsDir() || !strings.HasSuffix(entry.Name(), ".sql") {
			continue
		}
		var applied bool
		if err = tx.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM schema_migrations WHERE version=$1)`, entry.Name()).Scan(&applied); err != nil {
			return err
		}
		if applied {
			continue
		}
		sql, err := os.ReadFile("migrations/" + entry.Name())
		if err != nil {
			return err
		}
		if _, err = tx.Exec(ctx, string(sql)); err != nil {
			return fmt.Errorf("migration %s: %w", entry.Name(), err)
		}
		if _, err = tx.Exec(ctx, `INSERT INTO schema_migrations(version) VALUES($1)`, entry.Name()); err != nil {
			return err
		}
	}
	return tx.Commit(ctx)
}
