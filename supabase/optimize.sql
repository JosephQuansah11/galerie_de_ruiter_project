-- Supabase/PostgreSQL query indexes for Galerie de Ruiter.
--
-- Run this once in the Supabase SQL editor (or `psql "$DATABASE_URL" -f supabase/optimize.sql`)
-- after the API has created its tables. It is deliberately separate from the application's
-- schema.sql: this file uses pg_trgm and partial indexes, which are PostgreSQL features that the
-- H2 test database does not understand, and it must not make the API's startup depend on an
-- extension being installable by the application role.
--
-- Every statement is idempotent. Re-running it is safe.

create extension if not exists pg_trgm;

-- Artist search is `lower(first_name) like '%term%'`, which a B-tree cannot use. Trigram GIN
-- indexes turn the three OR branches into index lookups instead of a scan of every designer.
create index if not exists idx_designers_first_name_trgm
    on designers using gin (lower(first_name) gin_trgm_ops);
create index if not exists idx_designers_middle_name_trgm
    on designers using gin (lower(middle_name) gin_trgm_ops);
create index if not exists idx_designers_last_name_trgm
    on designers using gin (lower(last_name) gin_trgm_ops);

-- The public category list counts the pieces filed under each category.
create index if not exists idx_antiques_category on antiques (category_id);
create index if not exists idx_antiques_artist on antiques (artist_id);

-- The catalogue sorts a piece's photographs; the image table is the largest one in the database.
create index if not exists idx_antique_images_antique_display_order
    on antique_images (antique_id, display_order);
create index if not exists idx_antique_images_antique_position
    on antique_images (antique_id, position);

-- The storage migration only looks at rows where the original is still in PostgreSQL (or where
-- it can be released). Partial indexes keep those checks off the full image table.
create index if not exists idx_antique_images_pending_storage
    on antique_images (id) where storage_key is null;
create index if not exists idx_antique_images_releasable_storage
    on antique_images (id) where storage_key is not null and data is not null;
create index if not exists idx_antique_images_not_webp
    on antique_images (id) where lower(content_type) <> 'image/webp';

-- The dashboard asks for views in a time window on every load.
create index if not exists idx_antique_views_created_at on antique_views (created_at);

-- The interest list reads one visitor's rows newest first; the unique (antique_id, user_id) index
-- already serves the per-piece lookups and the delete cascade.
create index if not exists idx_antique_interests_user_created
    on antique_interests (user_id, created_at);

-- Account lookup and the category tree.
create index if not exists idx_users_keycloak_subject on users (keycloak_subject);
create index if not exists idx_categories_parent on categories (parent_id);

-- The chat restores a visitor's appointments newest first.
create index if not exists idx_appointments_subject_start
    on appointments (keycloak_subject, starts_at);

analyze antiques;
analyze antique_images;
analyze antique_views;
analyze antique_interests;
analyze categories;
analyze designers;
analyze users;
