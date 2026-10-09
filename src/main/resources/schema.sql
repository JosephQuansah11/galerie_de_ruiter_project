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
        display_order INTEGER NOT NULL,
        data BYTEA NOT NULL,
        content_type VARCHAR(255) NOT NULL
);

INSERT INTO antique_images (id, antique_id, display_order, data, content_type)
SELECT gen_random_uuid(), id, 0, image_data, COALESCE(image_content_type, 'application/octet-stream')
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