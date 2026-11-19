BEGIN;
SELECT pg_advisory_xact_lock(1735427);
CREATE TABLE IF NOT EXISTS example_seeds (name text PRIMARY KEY);
ALTER TABLE example_seeds ADD COLUMN IF NOT EXISTS client_id bigint REFERENCES clients(id) ON DELETE SET NULL;
DO $$
DECLARE
  client_id bigint;
  project_id bigint;
  board_id bigint;
  cable_id bigint;
  quote_id bigint;
  demo_project_id bigint;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM example_seeds WHERE name = 'v1') THEN

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
  INSERT INTO example_seeds(name,client_id) VALUES ('v1',client_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM example_seeds WHERE name = 'v2') THEN
    SELECT s.client_id INTO client_id FROM example_seeds s WHERE s.name = 'v1';
    IF client_id IS NULL THEN
      INSERT INTO clients(name, email, phone, address)
        VALUES ('Cliente de ejemplo', 'ejemplo@example.invalid', '000-000000', 'Dirección ficticia') RETURNING id INTO client_id;
    END IF;
    INSERT INTO projects(client_id, name, address, description, installation_type, supply_type)
      VALUES (client_id, 'Taller Sur', 'Dirección ficticia', 'Datos ficticios para pruebas', 'Industria', 'Trifásica') RETURNING id INTO project_id;
    INSERT INTO boards(project_id, name) VALUES (project_id, 'Tablero de máquinas') RETURNING id INTO board_id;
    INSERT INTO circuits(board_id, identifier, description, circuit_type, power_w, voltage_v, protection, conductor_mm2, length_m)
      VALUES (board_id, 'C1', 'Torno', 'Fuerza motriz', 5000, 380, 'Dato ficticio', 4, 25);
    INSERT INTO boards(project_id, name) VALUES (project_id, 'Tablero de reserva');
    INSERT INTO projects(client_id, name) VALUES (client_id, 'Obra vacía');
    INSERT INTO projects(client_id, name, address, description, installation_type, supply_type)
      VALUES (client_id, 'Obra en montaje', 'Dirección ficticia', 'Datos ficticios para pruebas', 'Vivienda', 'Monofásica') RETURNING id INTO project_id;
    INSERT INTO boards(project_id, name) VALUES (project_id, 'Tablero de montaje');
    INSERT INTO example_seeds(name,client_id) VALUES ('v2',client_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM example_seeds WHERE name = 'v3') THEN
    INSERT INTO clients(name, email, address)
      VALUES ('Asociación Cultural La Estación', 'estacion@example.invalid', 'Pasaje del Andén 120 (ficticio)')
      RETURNING id INTO client_id;
    INSERT INTO projects(client_id, name, address, description, installation_type, supply_type, status)
      VALUES (client_id, 'Centro Cultural La Estación', 'Pasaje del Andén 120 (ficticio)',
        'Renovación de la sala principal y el auditorio. Datos ficticios de demostración.',
        'Comercial', 'Trifásica', 'en ejecución')
      RETURNING id INTO demo_project_id;

    INSERT INTO boards(project_id, name) VALUES (demo_project_id, 'Tablero de sala principal') RETURNING id INTO board_id;
    INSERT INTO circuits(board_id, identifier, description, circuit_type, power_w, voltage_v, protection, conductor_mm2, length_m) VALUES
      (board_id, 'C1', 'Iluminación de sala', 'Iluminación', 480, 220, 'Térmica 10 A', 1.5, 32),
      (board_id, 'C2', 'Tomas de recepción', 'Tomas', 1500, 220, 'Térmica 16 A', 2.5, 24),
      (board_id, 'C3', 'Climatización de sala', 'Climatización', 2200, 220, 'Térmica 20 A', 4, 18);
    INSERT INTO boards(project_id, name) VALUES (demo_project_id, 'Tablero de auditorio') RETURNING id INTO board_id;
    INSERT INTO circuits(board_id, identifier, description, circuit_type, power_w, voltage_v, protection, conductor_mm2, length_m) VALUES
      (board_id, 'C1', 'Iluminación de escenario', 'Iluminación', 900, 220, 'Térmica 10 A', 1.5, 26),
      (board_id, 'C2', 'Tomas de cabina técnica', 'Tomas', 1800, 220, 'Térmica 16 A', 2.5, 34),
      (board_id, 'C3', 'Iluminación de pasillos', 'Iluminación', 240, 220, 'Térmica 10 A', 1.5, 20);

    WITH demo_materials(name, category, unit, price_cents, quantity) AS (
      VALUES
        ('Cable 1,5 mm²', 'Conductores', 'm', 110000, 120),
        ('Cable 2,5 mm²', 'Conductores', 'm', 175000, 90),
        ('Cable 4 mm²', 'Conductores', 'm', 260000, 30),
        ('Canalización de 20 mm', 'Canalizaciones', 'm', 210000, 45.5),
        ('Gabinete de 12 módulos', 'Tableros', 'u', 5800000, 2)
    ), new_materials AS (
      INSERT INTO materials(name, category, unit, price_cents)
        SELECT name, category, unit, price_cents FROM demo_materials
        RETURNING id, name
    )
    INSERT INTO project_materials(project_id, material_id, quantity)
      SELECT demo_project_id, m.id, d.quantity FROM new_materials m JOIN demo_materials d USING (name);

    INSERT INTO quotations(project_id, version, labor_cents)
      VALUES (demo_project_id, 1, 18000000) RETURNING id INTO quote_id;
    INSERT INTO quotation_items(quotation_id, name, unit, quantity, price_cents, total_cents)
      SELECT quote_id, m.name, m.unit, pm.quantity, m.price_cents, round(pm.quantity*m.price_cents)::bigint
      FROM project_materials pm JOIN materials m ON m.id=pm.material_id
      WHERE pm.project_id=demo_project_id;

    INSERT INTO activities(project_id, description, observation, occurred_on) VALUES
      (demo_project_id, 'Relevamiento inicial', 'Se identificaron los circuitos de ambos sectores.', CURRENT_DATE - 14),
      (demo_project_id, 'Revisión del cómputo', 'Se ajustó el recorrido de la canalización del auditorio.', CURRENT_DATE - 7),
      (demo_project_id, 'Inicio del montaje', 'Se reservaron ambos gabinetes para la próxima visita.', CURRENT_DATE - 2);
    INSERT INTO example_seeds(name,client_id) VALUES ('v3',client_id);
  END IF;
END $$;

-- Esquemas ficticios de demostración para el editor de cableado.
DO $$
DECLARE
  demo_client bigint;
  demo_project bigint;
  zone text;
BEGIN
  IF EXISTS (SELECT 1 FROM example_seeds WHERE name = 'v4-wiring') THEN
    RETURN;
  END IF;

  INSERT INTO clients(name,email) VALUES ('Demostraciones de cableado','cableado@example.invalid')
    RETURNING id INTO demo_client;
  FOREACH zone IN ARRAY ARRAY[
    'Casa Los Aromos','Casa El Ombú','Dúplex del Parque','Cabaña del Lago','Loft del Molino',
    'Taller del Andén','Biblioteca del Barrio','Café La Esquina','Estudio Horizonte','Oficinas del Patio',
    'Escuela del Mirador','Club del Bosque','Centro Vecinal Norte','Galería del Puente','Hostería del Valle',
    'Consultorios de la Plaza','Mercado del Puerto','Aula de Oficios','Depósito Los Sauces','Salón del Paseo'
  ] LOOP
    INSERT INTO projects(client_id,name,description,supply_type)
      VALUES (demo_client,'[Demo cableado] ' || zone,'Obra ficticia con esquemas editables','Monofásica')
      RETURNING id INTO demo_project;

    INSERT INTO wiring_schemes(project_id,drawing)
      SELECT demo_project, sample.drawing
      FROM (VALUES
        ($drawing${"name":"Luz simple","voltage":220,"parts":[{"id":"src","kind":"source","x":0,"y":0,"on":false},
          {"id":"s1","kind":"simple","x":210,"y":-90,"on":true},
          {"id":"lamp","kind":"lamp","x":650,"y":0,"on":false}],
         "wires":[{"from":"src.L","to":"s1.C","kind":"Fase"},
          {"from":"s1.1","to":"lamp.L","kind":"Retorno"},
          {"from":"src.N","to":"lamp.N","kind":"Neutro"},
          {"from":"src.PE","to":"lamp.PE","kind":"Tierra"}]}$drawing$::jsonb),
        ($drawing${"name":"Luz desde dos puntos","voltage":220,"parts":[{"id":"src","kind":"source","x":0,"y":0,"on":false},
          {"id":"s1","kind":"change","x":210,"y":-90,"on":false},
          {"id":"s2","kind":"change","x":425,"y":-90,"on":false},
          {"id":"lamp","kind":"lamp","x":650,"y":0,"on":false}],
         "wires":[{"from":"src.L","to":"s1.C","kind":"Fase"},
          {"from":"s1.1","to":"s2.1","kind":"Viajero"},
          {"from":"s1.2","to":"s2.2","kind":"Viajero"},
          {"from":"s2.C","to":"lamp.L","kind":"Retorno"},
          {"from":"src.N","to":"lamp.N","kind":"Neutro"},
          {"from":"src.PE","to":"lamp.PE","kind":"Tierra"}]}$drawing$::jsonb),
        ($drawing${"name":"Dos luces independientes","voltage":220,"parts":[{"id":"src","kind":"source","x":0,"y":0,"on":false},
          {"id":"s1","kind":"simple","x":210,"y":-90,"on":true},
          {"id":"s2","kind":"simple","x":210,"y":180,"on":false},
          {"id":"lamp","kind":"lamp","x":650,"y":0,"on":false},
          {"id":"lamp2","kind":"lamp","x":650,"y":240,"on":false}],
         "wires":[{"from":"src.L","to":"s1.C","kind":"Fase"},
          {"from":"src.L","to":"s2.C","kind":"Fase"},
          {"from":"s1.1","to":"lamp.L","kind":"Retorno"},
          {"from":"s2.1","to":"lamp2.L","kind":"Retorno"},
          {"from":"src.N","to":"lamp.N","kind":"Neutro"},
          {"from":"src.PE","to":"lamp.PE","kind":"Tierra"},
          {"from":"src.N","to":"lamp2.N","kind":"Neutro"},
          {"from":"src.PE","to":"lamp2.PE","kind":"Tierra"}]}$drawing$::jsonb),
        ($drawing${"name":"Neutro por caja de paso","voltage":220,"parts":[{"id":"src","kind":"source","x":0,"y":0,"on":false},
          {"id":"s1","kind":"simple","x":210,"y":-90,"on":true},
          {"id":"box","kind":"box","x":420,"y":130,"on":false},
          {"id":"lamp","kind":"lamp","x":650,"y":0,"on":false}],
         "wires":[{"from":"src.L","to":"s1.C","kind":"Fase"},
          {"from":"s1.1","to":"lamp.L","kind":"Retorno"},
          {"from":"src.N","to":"box.J1","kind":"Neutro"},
          {"from":"box.J2","to":"lamp.N","kind":"Neutro"},
          {"from":"src.PE","to":"lamp.PE","kind":"Tierra"}]}$drawing$::jsonb)
      ) AS sample(drawing);
  END LOOP;

  INSERT INTO example_seeds(name,client_id) VALUES ('v4-wiring',demo_client);
END $$;
COMMIT;
