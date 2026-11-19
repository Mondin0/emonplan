-- Preserve version markers created by older example loaders.
CREATE TABLE IF NOT EXISTS example_seeds (name text PRIMARY KEY);
ALTER TABLE example_seeds ADD COLUMN IF NOT EXISTS client_id bigint REFERENCES clients(id) ON DELETE SET NULL;
