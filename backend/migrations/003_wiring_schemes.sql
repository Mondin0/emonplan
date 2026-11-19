CREATE TABLE wiring_schemes (
    id bigserial PRIMARY KEY,
    project_id bigint NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    drawing jsonb NOT NULL
);
CREATE INDEX wiring_schemes_project_idx ON wiring_schemes(project_id,id);
