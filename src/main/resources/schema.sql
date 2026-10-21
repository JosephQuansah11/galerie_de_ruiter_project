DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_attribute attribute
        JOIN pg_class table_definition ON table_definition.oid = attribute.attrelid
        JOIN pg_namespace schema_definition ON schema_definition.oid = table_definition.relnamespace
        JOIN pg_type column_type ON column_type.oid = attribute.atttypid
        WHERE schema_definition.nspname = current_schema()
          AND table_definition.relname = 'antiques'
          AND attribute.attname = 'image_data'
          AND NOT attribute.attisdropped
          AND column_type.typname = 'oid'
    ) THEN
        ALTER TABLE antiques
            ALTER COLUMN image_data TYPE bytea
            USING lo_get(image_data);
    END IF;
END $$@@@@;

CREATE TABLE IF NOT EXISTS antique_images (
        id UUID PRIMARY KEY,
        antique_id UUID NOT NULL REFERENCES antiques(id),
        display_order VARCHAR(255) NOT NULL,
        data BYTEA NOT NULL,
        content_type VARCHAR(255) NOT NULL
);

-- Older databases created display_order as an integer, while the entity has always ordered
-- photographs by a string (it tolerates blank and non-numeric values). Hibernate's update does not
-- reliably change an existing integer column, so an image upload or a reorder could fail with a
-- type error. Widen it once; numeric values cast cleanly and the ordering code still reads them.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = 'antique_images'
          AND column_name = 'display_order'
          AND data_type IN ('smallint', 'integer', 'bigint')
    ) THEN
        ALTER TABLE antique_images
            ALTER COLUMN display_order TYPE VARCHAR(255)
            USING display_order::text;
    END IF;
END $$@@@@;

-- Columns added after the first version of this table. Hibernate normally creates them, but
-- making them explicit here means an old database is complete before any image request or delete
-- reaches it.
ALTER TABLE antique_images ADD COLUMN IF NOT EXISTS storage_key VARCHAR(255);
ALTER TABLE antique_images ADD COLUMN IF NOT EXISTS thumbnail BYTEA;
ALTER TABLE antique_images ADD COLUMN IF NOT EXISTS medium BYTEA;
ALTER TABLE antique_images ADD COLUMN IF NOT EXISTS large BYTEA;

-- The admin interest pipeline stage. Sold is derived from the existing sold flag, so only the
-- two open stages are stored.
ALTER TABLE antiques ADD COLUMN IF NOT EXISTS interest_status VARCHAR(255) NOT NULL DEFAULT 'NEW';
UPDATE antiques SET interest_status = 'NEW' WHERE interest_status IS NULL;

-- The visitor interest list. Hibernate creates this too; naming it here means an older database
-- has the table before an update/delete request reaches it.
CREATE TABLE IF NOT EXISTS antique_interests (
        id UUID PRIMARY KEY,
        antique_id UUID NOT NULL REFERENCES antiques(id),
        user_id UUID NOT NULL REFERENCES users(id),
        created_at TIMESTAMP WITH TIME ZONE NOT NULL,
        CONSTRAINT uk_antique_interests_user UNIQUE (antique_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_antique_interests_user_created
    ON antique_interests (user_id, created_at);

INSERT INTO antique_images (id, antique_id, display_order, data, content_type)
SELECT gen_random_uuid(), id, '0', image_data, COALESCE(image_content_type, 'application/octet-stream')
FROM antiques
WHERE image_data IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM antique_images WHERE antique_images.antique_id = antiques.id);

-- Long gallery notes (condition, provenance, stories) do not fit in the original
-- varchar(255) description column. Widen it to text. Safe to run repeatedly.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = 'antiques'
          AND column_name = 'description'
          AND data_type <> 'text'
    ) THEN
        ALTER TABLE antiques ALTER COLUMN description TYPE text;
    END IF;
END $$@@@@;