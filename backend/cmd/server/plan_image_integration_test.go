package main

import (
	"bytes"
	"context"
	"crypto/rand"
	"encoding/hex"
	"os"
	"testing"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// TEST_DATABASE_URL must identify a database whose user can create schemas.
// The test uses and removes only its own randomly named schema.
func TestPlanImagePostgres(t *testing.T) {
	url := os.Getenv("TEST_DATABASE_URL")
	if url == "" {
		t.Skip("set TEST_DATABASE_URL to run PostgreSQL integration tests")
	}
	ctx := context.Background()
	admin, err := pgxpool.New(ctx, url)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(admin.Close)
	var random [16]byte
	if _, err := rand.Read(random[:]); err != nil {
		t.Fatal(err)
	}
	schema := "emonplan_test_" + hex.EncodeToString(random[:])
	identifier := pgx.Identifier{schema}.Sanitize()
	if _, err := admin.Exec(ctx, "CREATE SCHEMA "+identifier); err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() {
		if _, err := admin.Exec(ctx, "DROP SCHEMA "+identifier+" CASCADE"); err != nil {
			t.Errorf("remove test schema: %v", err)
		}
	})
	config, err := pgxpool.ParseConfig(url)
	if err != nil {
		t.Fatal(err)
	}
	config.ConnConfig.RuntimeParams["search_path"] = schema
	open := func() *pgxpool.Pool {
		pool, err := pgxpool.NewWithConfig(ctx, config)
		if err != nil {
			t.Fatal(err)
		}
		return pool
	}
	db := open()
	t.Cleanup(func() { db.Close() })
	previous, err := os.Getwd()
	if err != nil {
		t.Fatal(err)
	}
	if err = os.Chdir("../.."); err != nil {
		t.Fatal(err)
	}
	err = migrate(ctx, db)
	if err == nil {
		err = migrate(ctx, db)
	}
	if restoreErr := os.Chdir(previous); restoreErr != nil {
		t.Fatal(restoreErr)
	}
	if err != nil {
		t.Fatal(err)
	}
	var client, project int64
	if err = db.QueryRow(ctx, "INSERT INTO clients(name) VALUES('Cliente') RETURNING id").Scan(&client); err != nil {
		t.Fatal(err)
	}
	if err = db.QueryRow(ctx, "INSERT INTO projects(client_id,name) VALUES($1,'Obra') RETURNING id", client).Scan(&project); err != nil {
		t.Fatal(err)
	}
	store := planImageDB{db}
	if _, err = db.Exec(ctx, "INSERT INTO project_plan_images(project_id,content_type,content) VALUES($1,'image/svg+xml',$2)", project, []byte("invalid")); err == nil {
		t.Fatal("database accepted an unsupported content type")
	}
	if _, err = db.Exec(ctx, "INSERT INTO project_plan_images(project_id,content_type,content) VALUES($1,'image/png',$2)", project+1, []byte("invalid")); err == nil {
		t.Fatal("database accepted a missing project")
	}
	if err = store.put(ctx, project, "image/png", []byte("first")); err != nil {
		t.Fatal(err)
	}
	if err = store.put(ctx, project, "image/jpeg", []byte("replacement")); err != nil {
		t.Fatal(err)
	}
	db.Close()
	db = open()
	store.db = db
	typ, data, err := store.get(ctx, project)
	if err != nil || typ != "image/jpeg" || !bytes.Equal(data, []byte("replacement")) {
		t.Fatalf("image after reconnect: type=%q data=%q err=%v", typ, data, err)
	}
	if _, err = db.Exec(ctx, "DELETE FROM projects WHERE id=$1", project); err != nil {
		t.Fatal(err)
	}
	if _, _, err = store.get(ctx, project); err != pgx.ErrNoRows {
		t.Fatalf("image after project deletion: %v", err)
	}
	t.Run("example data is repeatable and preserves edits", func(t *testing.T) {
		sql, err := os.ReadFile("../../../scripts/ejemplos.sql")
		if err != nil {
			t.Fatal(err)
		}
		if _, err = db.Exec(ctx, string(sql)); err != nil {
			t.Fatal(err)
		}
		if _, err = db.Exec(ctx, `UPDATE projects SET description='editado' WHERE name='Proyecto de ejemplo'`); err != nil {
			t.Fatal(err)
		}
		if _, err = db.Exec(ctx, string(sql)); err != nil {
			t.Fatal(err)
		}
		var count int
		var description string
		if err = db.QueryRow(ctx, `SELECT count(*), max(description) FROM projects WHERE name='Proyecto de ejemplo'`).Scan(&count, &description); err != nil {
			t.Fatal(err)
		}
		if count != 1 || description != "editado" {
			t.Fatalf("count=%d description=%q", count, description)
		}
		if err = db.QueryRow(ctx, `SELECT count(*) FROM circuits WHERE description LIKE '%ejemplo%'`).Scan(&count); err != nil || count < 2 {
			t.Fatalf("circuits=%d err=%v", count, err)
		}
	})
}
