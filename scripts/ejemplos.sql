BEGIN;
SELECT pg_advisory_xact_lock(1735427);
CREATE TABLE IF NOT EXISTS example_seeds (name text PRIMARY KEY);
DO $$
DECLARE
  client_id bigint;
  project_id bigint;
  board_id bigint;
  cable_id bigint;
  quote_id bigint;
BEGIN
  IF EXISTS (SELECT 1 FROM example_seeds WHERE name = 'v1') THEN
    RETURN;
  END IF;

  INSERT INTO clients(name, email, phone, address)
    VALUES ('Cliente de ejemplo', 'ejemplo@example.invalid', '000-000000', 'Dirección ficticia') RETURNING id INTO client_id;
  INSERT INTO projects(client_id, name, address, description, installation_type, supply_type)
    VALUES (client_id, 'Proyecto de ejemplo', 'Dirección ficticia', 'Datos ficticios para pruebas', 'Vivienda', 'Monofásica') RETURNING id INTO project_id;
  INSERT INTO boards(project_id, name) VALUES (project_id, 'Tablero de ejemplo') RETURNING id INTO board_id;
  INSERT INTO circuits(board_id, identifier, description, circuit_type, power_w, voltage_v, protection, conductor_mm2, length_m) VALUES
    (board_id, 'C1', 'Iluminación de ejemplo', 'Iluminación', 600, 220, 'Dato ficticio', 1.5, 20),
    (board_id, 'C2', 'Tomas de ejemplo', 'Tomas', 1200, 220, 'Dato ficticio', 2.5, 30);
  INSERT INTO materials(name, category, unit, price_cents)
    VALUES ('Cable de ejemplo', 'Ficticio', 'm', 100000) RETURNING id INTO cable_id;
  INSERT INTO project_materials(project_id, material_id, quantity) VALUES (project_id, cable_id, 50);
  INSERT INTO quotations(project_id, version, labor_cents) VALUES (project_id, 1, 1000000) RETURNING id INTO quote_id;
  INSERT INTO quotation_items(quotation_id, name, unit, quantity, price_cents, total_cents)
    VALUES (quote_id, 'Cable de ejemplo', 'm', 50, 100000, 5000000);
  INSERT INTO activities(project_id, description, observation, occurred_on)
    VALUES (project_id, 'Visita de ejemplo', 'Todos los datos son ficticios.', CURRENT_DATE);
  INSERT INTO example_seeds(name) VALUES ('v1');
END $$;
COMMIT;
