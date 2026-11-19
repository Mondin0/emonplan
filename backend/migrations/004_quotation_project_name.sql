ALTER TABLE quotations ADD COLUMN project_name text;

UPDATE quotations q SET project_name = p.name
FROM projects p WHERE p.id = q.project_id;

ALTER TABLE quotations ALTER COLUMN project_name SET NOT NULL;
