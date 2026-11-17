CREATE TABLE project_plan_images (
    project_id bigint PRIMARY KEY REFERENCES projects(id) ON DELETE CASCADE,
    content_type text NOT NULL CHECK (content_type IN ('image/png', 'image/jpeg')),
    content bytea NOT NULL CHECK (octet_length(content) BETWEEN 1 AND 10485760)
);
