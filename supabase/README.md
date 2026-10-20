# Supabase database optimization

The Render blueprint currently gives the API its own `galerie-app-db` PostgreSQL database and uses
Supabase only for Auth. The API switches to Supabase Postgres only when `DATABASE_URL` is set on the
`galerie-java-api` service; `application-prod.yml` prefers that variable over `DATABASE_HOST` and the
other Render database variables.

If this project is moving its rows to Supabase:

1. Copy the connection string from **Supabase → Project Settings → Database → Connection string**.
   Prefer the **session pooler** for a normal JVM, or the **transaction pooler** with
   `?prepareThreshold=0` on the JDBC URL. PgBouncer in transaction mode does not support the
   server-side prepared statements the driver would otherwise reuse.
2. Set `DATABASE_URL`, `DATABASE_USERNAME` and `DATABASE_PASSWORD` on the API service. Leave the
   old `DATABASE_HOST/PORT/NAME` variables in place only if you still want the Render database as a
   fallback.
3. Keep the connection pool small. `application-prod.yml` defaults to five connections
   (`DB_POOL_MAX_SIZE`), one idle, a ten-second checkout timeout and a thirty-minute maximum
   lifetime. Raise it only after checking the Supabase connection limit and the API's real
   concurrency.
4. Deploy the API once so Hibernate creates the current tables, then run
   [`optimize.sql`](./optimize.sql) in the Supabase SQL editor. It adds the query indexes, pg_trgm
   indexes for artist search, partial indexes for the storage migration, and refreshes planner
   statistics.
5. Confirm the plan uses the new indexes with:

   ```sql
   explain (analyze, buffers)
   select i.antique_id, i.id
   from antique_images i
   where i.antique_id = '...';
   ```

   The dashboard's view chart should use `idx_antique_views_created_at`; artist search should use a
   `Bitmap Index Scan` on one of the trigram indexes.

The application also avoids loading image bytes for catalogue and category responses, keeps the
small 400-pixel thumbnails on the row, and stores only metadata for migrated originals. The admin
inventory's **Photograph storage** card can copy originals to R2 and then release the database copies;
that is the single largest database-size saving.

After a large migration, `VACUUM (ANALYZE)` is enough. Avoid `VACUUM FULL` on a live site: it takes
an exclusive lock and rewrites the whole table.
