package main

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"os"
	"testing"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

func TestUnifilarPostgres(t *testing.T) {
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
	db, err := pgxpool.NewWithConfig(ctx, config)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(db.Close)
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

	// U2: dos obras con el mismo tablero y el mismo identificador visible C1.
	newObra := func(name string) int64 {
		var client, project, board, circuit int64
		if err := db.QueryRow(ctx, "INSERT INTO clients(name) VALUES($1) RETURNING id", "Cliente "+name).Scan(&client); err != nil {
			t.Fatal(err)
		}
		if err := db.QueryRow(ctx, "INSERT INTO projects(client_id,name) VALUES($1,$2) RETURNING id", client, name).Scan(&project); err != nil {
			t.Fatal(err)
		}
		if err := db.QueryRow(ctx, "INSERT INTO boards(project_id,name) VALUES($1,'Tablero') RETURNING id", project).Scan(&board); err != nil {
			t.Fatal(err)
		}
		if err := db.QueryRow(ctx, `INSERT INTO circuits(board_id,identifier,description,power_w,voltage_v,protection,conductor_mm2,length_m)
			VALUES($1,'C1','Torno',5000,380,'Dato ficticio',4,25) RETURNING id`, board).Scan(&circuit); err != nil {
			t.Fatal(err)
		}
		return project
	}
	obraA := newObra("Obra A")
	obraB := newObra("Obra B")
	store := unifilarDB{db}
	for _, tc := range []struct {
		id       int64
		wantName string
	}{
		{obraA, "Obra A"},
		{obraB, "Obra B"},
	} {
		got, err := store.get(ctx, tc.id)
		if err != nil {
			t.Fatal(err)
		}
		if got.Name != tc.wantName || got.ID != tc.id {
			t.Fatalf("obra %+v", got)
		}
		if len(got.Boards) != 1 || got.Boards[0].Name != "Tablero" {
			t.Fatalf("tableros de %s: %+v", tc.wantName, got.Boards)
		}
		if got.Boards[0].ID == 0 {
			t.Fatal("board id not selected from its own project")
		}
		if len(got.Boards[0].Circuits) != 1 || got.Boards[0].Circuits[0].Identifier != "C1" {
			t.Fatalf("circuitos de %s: %+v", tc.wantName, got.Boards[0].Circuits)
		}
	}
	gotA, err := store.get(ctx, obraA)
	if err != nil {
		t.Fatal(err)
	}
	gotB, err := store.get(ctx, obraB)
	if err != nil {
		t.Fatal(err)
	}
	if gotA.Boards[0].ID == gotB.Boards[0].ID || gotA.Boards[0].Circuits[0].ID == gotB.Boards[0].Circuits[0].ID {
		t.Fatal("cada obra debe exponer solo sus propios tableros y circuitos")
	}
	if _, err = store.get(ctx, 999999); !errors.Is(err, errUnifilarNotFound) {
		t.Fatalf("obra inexistente: %v", err)
	}

	// Un cliente homónimo previo nunca recibe las obras de muestra.
	var realClient int64
	if err = db.QueryRow(ctx, "INSERT INTO clients(name,email) VALUES('Cliente de ejemplo','real@example.invalid') RETURNING id").Scan(&realClient); err != nil {
		t.Fatal(err)
	}
	// U6: la carga de ejemplos es repetible y conserva los datos previos.
	sql, err := os.ReadFile("../../../scripts/ejemplos.sql")
	if err != nil {
		t.Fatal(err)
	}
	for i := 0; i < 2; i++ {
		if _, err = db.Exec(ctx, string(sql)); err != nil {
			t.Fatal(err)
		}
	}
	var count int
	for _, tc := range []struct {
		table string
		want  int
	}{
		{"boards", 2}, {"project_materials", 5}, {"quotations", 1}, {"activities", 3},
	} {
		query := "SELECT count(*) FROM " + tc.table + " WHERE project_id IN (SELECT id FROM projects WHERE name='Centro Cultural La Estación')"
		if err = db.QueryRow(ctx, query).Scan(&count); err != nil || count != tc.want {
			t.Fatalf("demo %s: count=%d want=%d err=%v", tc.table, count, tc.want, err)
		}
	}
	if err = db.QueryRow(ctx, `SELECT count(*) FROM quotation_items i JOIN quotations q ON q.id=i.quotation_id
		JOIN projects p ON p.id=q.project_id WHERE p.name='Centro Cultural La Estación'
		AND i.total_cents=round(i.quantity*i.price_cents)`).Scan(&count); err != nil || count != 5 {
		t.Fatalf("renglones del presupuesto de demo: count=%d err=%v", count, err)
	}
	if err = db.QueryRow(ctx, "SELECT count(*) FROM projects WHERE client_id=$1", realClient).Scan(&count); err != nil || count != 0 {
		t.Fatalf("cliente homónimo recibió obras: %d (%v)", count, err)
	}
	for _, name := range []string{"Proyecto de ejemplo", "Taller Sur", "Obra vacía", "Obra en montaje"} {
		if err = db.QueryRow(ctx, `SELECT count(*) FROM projects WHERE name=$1`, name).Scan(&count); err != nil {
			t.Fatal(err)
		}
		if count != 1 {
			t.Fatalf("obras %q: count=%d, want 1", name, count)
		}
	}
	if err = db.QueryRow(ctx, `SELECT count(*) FROM boards b JOIN projects p ON p.id=b.project_id WHERE p.name='Taller Sur'`).Scan(&count); err != nil || count != 2 {
		t.Fatalf("tableros de Taller Sur: count=%d err=%v", count, err)
	}
	if err = db.QueryRow(ctx, `SELECT count(*) FROM circuits c JOIN boards b ON b.id=c.board_id JOIN projects p ON p.id=b.project_id WHERE p.name='Taller Sur' AND b.name='Tablero de reserva'`).Scan(&count); err != nil || count != 0 {
		t.Fatalf("circuitos de reserva: count=%d err=%v", count, err)
	}
	var identifierText, description string
	if err = db.QueryRow(ctx, `SELECT c.identifier,c.description FROM circuits c JOIN boards b ON b.id=c.board_id JOIN projects p ON p.id=b.project_id WHERE p.name='Taller Sur' AND b.name='Tablero de máquinas'`).Scan(&identifierText, &description); err != nil {
		t.Fatal(err)
	}
	if identifierText != "C1" || description != "Torno" {
		t.Fatalf("circuito de máquinas: %q %q", identifierText, description)
	}
	if err = db.QueryRow(ctx, `SELECT count(*) FROM boards b JOIN projects p ON p.id=b.project_id WHERE p.name='Obra vacía'`).Scan(&count); err != nil || count != 0 {
		t.Fatalf("tableros de Obra vacía: count=%d err=%v", count, err)
	}
	if err = db.QueryRow(ctx, `SELECT count(*) FROM boards b JOIN projects p ON p.id=b.project_id WHERE p.name='Obra en montaje'`).Scan(&count); err != nil || count != 1 {
		t.Fatalf("tableros de Obra en montaje: count=%d err=%v", count, err)
	}
	if err = db.QueryRow(ctx, `SELECT count(*) FROM circuits c JOIN boards b ON b.id=c.board_id JOIN projects p ON p.id=b.project_id WHERE p.name='Obra en montaje'`).Scan(&count); err != nil || count != 0 {
		t.Fatalf("circuitos de Obra en montaje: count=%d err=%v", count, err)
	}
	if err = db.QueryRow(ctx, `SELECT count(*) FROM projects WHERE name='Obra A'`).Scan(&count); err != nil || count != 1 {
		t.Fatalf("datos preexistentes alterados: count=%d err=%v", count, err)
	}

	// U6: una base con el ejemplo anterior (v1) ya cargado recibe v2 sin duplicar nada
	// ni alterar los identificadores y datos previos. Simulamos ese estado quitando
	// solo lo aportado por v2 y su marcador, sobre una base donde v1 ya existe.
	for _, stmt := range []string{
		`DELETE FROM circuits WHERE board_id IN (SELECT b.id FROM boards b JOIN projects p ON p.id=b.project_id WHERE p.name IN ('Taller Sur','Obra en montaje'))`,
		`DELETE FROM boards WHERE project_id IN (SELECT id FROM projects WHERE name IN ('Taller Sur','Obra en montaje'))`,
		`DELETE FROM projects WHERE name IN ('Taller Sur','Obra vacía','Obra en montaje')`,
		`DELETE FROM example_seeds WHERE name='v2'`,
		`UPDATE example_seeds SET client_id=NULL WHERE name='v1'`,
	} {
		if _, err = db.Exec(ctx, stmt); err != nil {
			t.Fatal(err)
		}
	}
	if err = db.QueryRow(ctx, `SELECT count(*) FROM example_seeds WHERE name='v1'`).Scan(&count); err != nil || count != 1 {
		t.Fatalf("estado esperado: v1 ya cargado (count=%d err=%v)", count, err)
	}
	for i := 0; i < 2; i++ {
		if _, err = db.Exec(ctx, string(sql)); err != nil {
			t.Fatal(err)
		}
	}
	for _, tc := range []struct{ query, label string }{
		{`SELECT count(*) FROM projects WHERE name='Proyecto de ejemplo'`, "Proyecto de ejemplo"},
		{`SELECT count(*) FROM projects WHERE name='Taller Sur'`, "Taller Sur"},
		{`SELECT count(*) FROM projects WHERE name='Obra vacía'`, "Obra vacía"},
		{`SELECT count(*) FROM projects WHERE name='Obra en montaje'`, "Obra en montaje"},

		{`SELECT count(*) FROM projects WHERE name='Obra A'`, "Obra A"},
	} {
		if err = db.QueryRow(ctx, tc.query).Scan(&count); err != nil || count != 1 {
			t.Fatalf("%s: count=%d err=%v", tc.label, count, err)
		}
	}
	// Los identificadores y datos del ejemplo v1 siguen intactos tras la segunda carga.
	if err = db.QueryRow(ctx, `SELECT count(*) FROM circuits c JOIN boards b ON b.id=c.board_id JOIN projects p ON p.id=b.project_id
		WHERE p.name='Proyecto de ejemplo' AND c.identifier='C1' AND c.description='Iluminación de ejemplo'`).Scan(&count); err != nil || count != 1 {
		t.Fatalf("C1 de ejemplo: count=%d err=%v", count, err)
	}
	if err = db.QueryRow(ctx, `SELECT count(*) FROM circuits c JOIN boards b ON b.id=c.board_id JOIN projects p ON p.id=b.project_id
		WHERE p.name='Proyecto de ejemplo' AND c.identifier='C2' AND c.description='Tomas de ejemplo'`).Scan(&count); err != nil || count != 1 {
		t.Fatalf("C2 de ejemplo: count=%d err=%v", count, err)
	}
	// Los datos ficticios de Obra A (creados antes de cargar ejemplos) siguen intactos.
	if err = db.QueryRow(ctx, `SELECT count(*) FROM circuits c JOIN boards b ON b.id=c.board_id JOIN projects p ON p.id=b.project_id
		WHERE p.name='Obra A' AND c.identifier='C1' AND c.description='Torno'`).Scan(&count); err != nil || count != 1 {
		t.Fatalf("circuito de Obra A: count=%d err=%v", count, err)
	}
	if err = db.QueryRow(ctx, "SELECT count(*) FROM projects WHERE client_id=$1", realClient).Scan(&count); err != nil || count != 0 {
		t.Fatalf("cliente homónimo recibió obras tras actualizar v1: %d (%v)", count, err)
	}
	// El ejemplo v2 quedó completo y sin duplicados.
	if err = db.QueryRow(ctx, `SELECT count(*) FROM boards b JOIN projects p ON p.id=b.project_id WHERE p.name='Taller Sur'`).Scan(&count); err != nil || count != 2 {
		t.Fatalf("tableros de Taller Sur tras v1 cargado: count=%d err=%v", count, err)
	}
	if err = db.QueryRow(ctx, `SELECT count(*) FROM circuits c JOIN boards b ON b.id=c.board_id JOIN projects p ON p.id=b.project_id WHERE p.name='Taller Sur' AND b.name='Tablero de máquinas'`).Scan(&count); err != nil || count != 1 {
		t.Fatalf("circuitos de máquinas tras v1 cargado: count=%d err=%v", count, err)
	}
}
