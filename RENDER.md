# Render production deployment

The Render blueprint deploys the public app and its dependent services:

- `galerie-app-db`: application PostgreSQL database
- `galerie-java-api`: Spring Boot API
- `galerie-frontend`: static React frontend with SPA rewrites

Production authentication is **Supabase Auth**. Keycloak is only used by the local development
stack and is no longer a Render service or database.

The blueprint used to declare `galerie-reconstruction-api`, a Python service that turned six
photographs into a 3D model, with a 1 GB data disk. Nothing called it - the frontend half of the
feature was removed before the gallery ever used it, and it ran with `RECONSTRUCTION_MODE=disabled` -
so it, its disk and its endpoints are gone. Syncing the blueprint deletes the Render service; the
models the gallery shows are `.glb` files an administrator uploads to `galerie-java-api`, which are
unrelated to it.

The application PostgreSQL database uses Render's current `basic-256mb` plan rather than the retired
`starter` plan. Review the database pricing and capacity in Render before syncing; changing a plan
can affect monthly costs.

## Supabase Auth on the API

The frontend signs in with Supabase, so the Java API must verify Supabase tokens. That only happens
when the `supabase` Spring profile is active:

- `SPRING_PROFILES_ACTIVE=prod,supabase`
- `SUPABASE_ISSUER_URI=https://bgmxpublcoldebamstbj.supabase.co/auth/v1`
- `SUPABASE_JWK_SET_URI=https://bgmxpublcoldebamstbj.supabase.co/auth/v1/.well-known/jwks.json`

The blueprint sets all three. `application-supabase.yml` names the Supabase issuer and key set,
uses `ES256` (Supabase's algorithm; Spring Boot defaults to `RS256`) and reads the project's key
set directly. If a Supabase sign-in leaves `/api/me` or `/api/me/avatar` answering 401, check these
values first: the API is still using the legacy Keycloak settings.

## Supabase egress

The free plan includes 5 GB of egress per month, and Supabase counts everything that leaves the
project: Auth, Storage, Database, Realtime, Edge Functions, the pooler and log drains. This
repository talks to Supabase in two places, and knowing which one is busy is the first step:

- **Auth** - the frontend signs in, refreshes a token about once an hour per open tab and signs out
  (`src/services/supabaseAuth.ts`); the API fetches the project's JWKS when it verifies a token.
  Those payloads are kilobytes. A report dominated by Auth means a refresh loop, a shared project,
  or another client using the same anon key.
- **Storage** - only when the API's four `STORAGE_*` variables point at Supabase Storage. The
  gallery's photographs are then read out of the bucket for every image request, so image traffic is
  Storage egress. `galerie-java-api` already speaks the S3 API; Cloudflare R2 is the cheaper endpoint
  for photographs because its egress is free. Point `STORAGE_ENDPOINT`, `STORAGE_BUCKET`,
  `STORAGE_ACCESS_KEY` and `STORAGE_SECRET_KEY` at R2, run the image-copy job, and Supabase stops
  being on the path of a photograph.
- **Database** - only when `DATABASE_URL` is set on `galerie-java-api` to the Supabase project. The
  blueprint gives the API its own `galerie-app-db`, but `application-prod.yml` prefers `DATABASE_URL`
  when it is present, so a value left in the Render dashboard overrides the blueprint's database
  without changing a file. Remove it and the API uses `DATABASE_HOST/PORT/NAME/USER/PASSWORD` from
  `galerie-app-db`.

Realtime, Edge Functions and log drains are not used by this project.

The API's list queries are written not to carry photographs: `CategoryRepository.findAllWithCounts`
and `AntiqueRepository.findStatsRows` are projections, and the catalogue names images without
reading their bytes. Before those projections, `/api/categories` loaded every piece - and the legacy
`image_data` column - on every page load, which is a database egress multiplier if the database is
Supabase. `CategoryApiTest` and `GalleryStatsServiceTest` fail if that path comes back.

For the images themselves, the API sends `Cache-Control: public, max-age=31536000, immutable` on
antique, welcome-slider and About photographs. The catalogue and every small card ask for the
400-pixel `/thumbnail` copy; a piece's own page offers 800-pixel and 1600-pixel copies through
`srcset`, so a phone never downloads a desktop original and a desktop never downloads a camera file.
The variants are generated once and kept on the row; existing photographs fill themselves in the
first time they are requested. `ThumbnailServiceTest`, `AntiqueImageAdminTest` and
`src/models/antiques/antiqueImages.test.ts` pin the sizes and the URLs.

The service stores and serves WebP: each photograph is converted when it is uploaded, in the
browser before it is sent and again on the server if an older client sends a JPEG. The 400, 800 and
1600-pixel variants are WebP too, written by the `webp-imageio` encoder registered with `ImageIO`
(it bundles libwebp for Linux, macOS and Windows). The welcome slider, About-page images and profile
avatars follow the same rule: uploads are converted in the browser and on the server, existing rows
are converted on their first read, and an avatar is capped at 512 pixels. The photographs that were
already in the catalogue are rewritten by the admin's **Photograph format** card on the inventory
page (`POST /api/admin/images/convert-to-webp`), which reports how many are left before it starts,
converts ten per call so no request outlives a proxy timeout, and replaces each original only after
the new object has been verified. `ImageFormatsTest`, `ThumbnailServiceTest`,
`AntiqueImageAdminTest` and `src/models/antiques/antiqueImages.test.ts` pin the formats, sizes and
URLs.

Originals are capped at 4000 pixels on the longest side, and a larger source is read with
subsampling: a fifty-megapixel camera file is never decoded at full size. That cap also keeps a
conversion batch inside the API's memory budget, so a large upload cannot restart the service.
`ThumbnailService` uses the same reader for its variants.

AVIF is not used: JDK `ImageIO` has no AVIF codec and browsers cannot encode it through a canvas,
so WebP is the one modern format the whole pipeline - upload, storage, variants and every browser
the gallery supports - can guarantee. The URLs are already split per size, so an AVIF pipeline can
later sit beside them with a `<picture>` element rather than a rewrite.

## Live content updates

The API exposes a public WebSocket at `/ws/content`. It carries only a topic name (`categories`,
`antiques`, `home`, `about`, `location`); the browser fetches fresh data through the normal,
authorized API when it hears one. The admin screens subscribe to it, so a category or piece changed
in another tab or by another administrator appears without a page reload. Render web services
support WebSocket connections; the browser reconnects with a short backoff if the socket drops.


## Cloudflare R2 optimization

R2 is the cheaper home for the gallery's originals because its egress is free. It is optional:
`ImageStorage` is inert until all four settings exist on the API service.

- `STORAGE_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com`
- `STORAGE_BUCKET=<bucket>`
- `STORAGE_ACCESS_KEY=<R2 access key id>`
- `STORAGE_SECRET_KEY=<R2 secret access key>`
- `STORAGE_PUBLIC_URL` is optional and only used by the storage helper today; the API still serves
  the photographs so the 400/800/1600 variants and the fallback-to-database path stay intact.

New R2 objects are written with `Content-Type`, `Content-Disposition: inline` and
`Cache-Control: public, max-age=31536000, immutable`. Put the bucket behind a Cloudflare custom
domain with **Cache Everything**, an edge TTL of one year and a browser TTL of one year. The object
names are immutable (the image id is part of the key), so a cached photograph never becomes stale.
CORS is not needed for ordinary `<img>` requests.

Then run the one-time migration from the admin inventory's **Photograph storage** card, or:

```text
GET  /api/admin/images/status
POST /api/admin/images/migrate-to-storage
POST /api/admin/images/release-stored-bytes?confirm=false   # report only
POST /api/admin/images/release-stored-bytes?confirm=true    # frees the database copy
```

The release step checks that every object exists in R2 before it clears `image_data`. Run the
report first and keep a database backup until it reports no failures. The API now also removes the
R2 object after an image row or a whole antique is deleted, instead of leaving an unreferenced object
in the bucket; the removal happens after the database transaction commits.

Check what PostgreSQL still holds:

```sql
select pg_size_pretty(pg_total_relation_size('antique_images')) as image_table,
       pg_size_pretty(sum(pg_column_size(data))) as original_bytes,
       count(*) filter (where storage_key is null) as originals_still_in_db
from antique_images;
```

## Keycloak

Keycloak is no longer deployed on Render. The `galerie-keycloak` service and `galerie-keycloak-db`
database were removed from the blueprint; a Blueprint sync deletes both. Production authenticates
with Supabase, and the API's legacy Keycloak admin/provisioning beans are disabled by the `supabase`
Spring profile. The local development stack and the realm files under `keycloak/realms` remain for
development, but they are not part of the Render deployment.

The frontend also needs `VITE_GOOGLE_MAPS_API_KEY` (also `sync: false`): a browser key for the Maps
Embed API and the Geocoding API, restricted by HTTP referrer to the gallery's origin
(`https://galeriederuiterantieks.gripe/*`). Without it the frame falls back to Google's keyless
embed, which still shows the map, but the admin's address lookup needs the key.

## Agent discovery

`galerie-frontend` serves the gallery's `llms.txt` and its `/.well-known/ai-catalog.json` - and the
same document at `/.well-known/ard.json`, the path the current Agentic Resource Discovery
specification names - as ordinary static files. Render answers with a file that exists before it
applies any rewrite, which is what makes the manifest JSON instead of the single-page
application's HTML; before those files existed, an audit that asked for the manifest
reported *"Malformed JSON in manifest: Unexpected token '<'"*. The `headers` block adds
`Access-Control-Allow-Origin: *` and `Cross-Origin-Resource-Policy: cross-origin` for
`/.well-known/*`, because a crawler reading the manifest from its own origin makes a cross-origin
request. See *Agent discovery* in the frontend README for the files themselves.

## Routes and the 404

The site is a single-page application, so `render.yaml` has to say which paths belong to it. It
names them one by one - the four public pages, the sign-in and registration pages, the account
screens, and the `/antiques/*` and `/admin/*` prefixes - and rewrites each to `/index.html`.
Everything else is a path the gallery does not have, and Render answers it with 404 Not Found.

Three of the addresses are not pages at all. `/home` is what the landing page was called before it
moved to the root, and `/dashboard` and `/dashboard/chat` are older still; each is a `redirect` rule
(a 301) rather than a rewrite, so a search engine is told which URL is canonical instead of finding
two pages that claim to be the same one. The root is the canonical landing page because Render
applies no rule to a domain root: the one address that cannot be redirected is the one that has to be
canonical. `index.html` carries no `<link rel="canonical">` for the same reason it carries no title
per route - it is served for all of them, and each page declares its own absolute URL at runtime.

That list *is* the 404 story on this deployment, and it replaced a catch-all (`/*` ->
`/index.html`) that answered every typo with the landing page and HTTP 200. An audit reported it,
and it is worth knowing why it matters: a search engine handed a 200 and a page indexes that page
under an address that does not exist, which is how a site collects error pages in its results.
Render does not let a site replace its own 404 page, so a visitor gets Render's; the container
deployment answers with the gallery's own `public/404.html` and the same 404 status (`error_page
404` in `nginx.conf`).

**These routes reach the live site through a Blueprint sync, not through a deploy.** They live in
the blueprint, and `autoDeploy` deploys code - so this list needs *Blueprint* -> *Sync* in the
dashboard, exactly like the header changes above, and the same values can be entered by hand under
*Redirects/Rewrites* for the service. A route added to the application without a rule here is a
deep link that 404s; `src/spaRoutes.test.ts` reads the router, this file and `nginx.conf` and fails
when the three disagree.

## Security headers

A static site has nothing running at the origin to add response headers, so
they are listed in the `headers` block of the `galerie-frontend` service in
`render.yaml` and Render sends them from the edge. Changing that block only
takes effect when the Blueprint is synced in the Render dashboard
(*Blueprint* → *Sync*): `autoDeploy` deploys code, not Blueprint changes. The
same values can be entered by hand under *Headers* for the service.

`galerie_de_ruiter_frontend_app/nginx.conf` sends the same set for the
container deployment - the headers themselves live in
`galerie_de_ruiter_frontend_app/security-headers.conf`, which that config includes
at the server level and again in the two locations whose own `add_header` would
drop the inherited ones (`/logout` and `/.well-known/`) - and
`galerie_de_ruiter_frontend_app/src/securityHeaders.test.ts` fails when the two
lists drift apart. See *Security headers* in the frontend README for what each
header is for, for why there is deliberately no `Cross-Origin-Embedder-Policy`
(it would make the Google Maps frame declare a policy this site cannot give it),
and for why `Clear-Site-Data` sits on `/logout` rather than on the whole site.

### Cloudflare's inline-script CSP error

If a browser reports that an inline script was blocked on a gallery page, the script is usually
Cloudflare's JavaScript Detections, not the application. Cloudflare injects it into HTML responses
with a token that changes on every request, so no CSP hash can allow it, and adding
`'unsafe-inline'` would undo the policy. The `Cache-Control` entries for the HTML entry points in
`render.yaml` send `no-transform`, Cloudflare's documented opt-out; the container deployment sends
the same directive from `nginx.conf`, and `src/securityHeaders.test.ts` checks both. After a
Blueprint sync, purge Cloudflare's cache for the HTML routes (or wait for `s-maxage=300` to expire)
and confirm the response no longer contains `/cdn-cgi/challenge-platform/scripts/jsd/main.js`.
JavaScript Detections can still be used with a nonce-based policy, which Cloudflare reads from the
CSP response header; a hash cannot work because the injected script changes each time. If the site
does not need JavaScript Detections, turning it off in Cloudflare (*Security* → *Bots*) removes the
injected script immediately, without waiting for a Blueprint sync or a cache purge.

## Secrets and first-time setup

1. Create or apply the blueprint from `render.yaml`; it sets Render's automatic
   deployment for each service.
2. Set `VITE_SUPABASE_ANON_KEY` on `galerie-frontend` in the Render dashboard
   (`sync: false`). The public `VITE_SUPABASE_URL` is already in the blueprint.
   The API's Supabase issuer and key-set URL are set there too, so there are no
   Keycloak secrets to provision.
3. Optionally set `VITE_GOOGLE_MAPS_API_KEY` on `galerie-frontend` for the
   location page's Embed API frame and the admin address lookup.

GitHub Actions generates temporary, random credentials for its isolated service
smoke test. These credentials are not used in production; Render's secrets must
be configured separately in its dashboard.

## Important production values

- Do not commit database passwords.
- `sync: false` variables in `render.yaml` must be populated in Render's
  dashboard. In particular, set the frontend's `VITE_SUPABASE_ANON_KEY` (and
  optionally `VITE_GOOGLE_MAPS_API_KEY`).
- The frontend's public origin is `SITE_URL=https://galeriederuiterantieks.gripe` in
  `render.yaml`. `sitemap.xml`, the `Sitemap:` line in `robots.txt`, the canonical URLs and the
  `og:url`/`og:image` tags are built from it; without it the build falls back to the same origin in
  `site.config.mjs`. If it names a host a crawler cannot fetch, Search Console reports every URL
  in the sitemap as "Couldn't fetch".
- The sitemap's `<image:loc>` entries point at `SITEMAP_API_URL`, which is the API host
  (`galerie-java-api.onrender.com`). Google's image-sitemap rules require both the page domain and
  the image domain to be verified in Search Console when they differ, so either verify that API
  host there or move the photographs to a host under `galeriederuiterantieks.gripe` (a custom API
  domain such as `api.galeriederuiterantieks.gripe` works) and point `SITEMAP_API_URL` and the
  frontend's `VITE_*` API values at it. The image endpoints must stay public.
  The API root serves the `google-site-verification` meta tag and is public, so Search Console's
  URL-prefix property for `https://galerie-java-api.onrender.com/` can be verified there.
- The gallery's public origin is `https://galeriederuiterantieks.gripe`, served by
  `galerie-frontend`. Its earlier free host has been retired from Render and Cloudflare; it must not
  be attached again - a redirect from any legacy link to the gallery's domain is the only thing that
  should answer there.
- `FRONTEND_ORIGIN` on `galerie-java-api` names the gallery's origin, the browser origin allowed to
  call the API. A comma-separated list still works, so a staging host can be added without a code
  change, but production names one domain. The backend also allows the localhost ports.
- The frontend environment variables are build-time values for the static site. Trigger a frontend deploy after changing them.
- The frontend's public Supabase settings are `VITE_SUPABASE_URL` in
  `render.yaml` and `VITE_SUPABASE_ANON_KEY` in the dashboard. The Webpack
  build injects them from Render's build environment; deploy the frontend after
  changing them.
- `FRONTEND_ORIGIN` and the Supabase issuer/key-set URLs must match the final Render service URLs.
- The chatbot sends requests through `galerie-java-api`, which calls the
  private `galerie-ollama` Docker service. Its model is downloaded at runtime
  and retained on the service's persistent disk. `GET /api/chat/status` reports
  whether the model connection is established; the chat interface waits for a
  ready status before it accepts a prompt, so a cold model never receives a
  request it cannot answer.
- `CROSS_SITE_CSRF_COOKIES` (default `true` in the `prod` profile) marks the
  `XSRF-TOKEN` cookie as `SameSite=None; Secure`. The Render frontend and API are
  different origins, so without it the browser drops the cookie and every
  authenticated write (profile details, avatar and image uploads) fails with 403.
  The frontend reads that cookie and sends it back as `X-XSRF-TOKEN`; it only calls
  `/api/login` when no cookie exists, and caches the token for the page, instead of
  asking for a new one before every write.
- 3D models are stored on a persistent disk, not in PostgreSQL. `galerie-java-api` mounts
  `galerie-models` at `/app/data/models` and `MODELS_STORAGE_DIR` points at that path; uploads
  are streamed to the file, so a large `.glb` never has to fit in the JVM heap or pass through
  a database column. A disk pins the service to a single instance, and its size is the real
  ceiling on how many models the gallery can hold, so raise `sizeGB` as the collection grows
  (or move the directory to object storage). `MODELS_MAX_SIZE_MB` still caps a single upload,
  and the frontend build value `VITE_MODELS_MAX_SIZE_MB` must match it so the form rejects the
  same files the API does. Models uploaded before this change are still served from their
  `antique_models` row, so nothing had to be migrated by hand; re-uploading a model moves it
  to the disk.
- The Java API receives the `galerie-app-db` internal host, port, database, username, and password through the `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_NAME`, `DATABASE_USERNAME`, and `DATABASE_PASSWORD` variables. The Spring profile assembles these into a JDBC URL.
- If you created a standalone Java web service instead of the `galerie-java-api` blueprint service, add those five variables and link each to the corresponding **internal** property of `galerie-app-db` in that service's environment. Alternatively, set `DATABASE_URL` to a valid JDBC URL beginning `jdbc:postgresql://`. Ensure the database and web service are in the same Render region.
- The Java API listens on Render's `PORT`.
- Render health checks use `/actuator/health` for Spring Boot. There is no Keycloak
  health endpoint in the Render deployment any more.
- The frontend uses SPA fallback so React routes such as `/antiques/:id` work after refresh.

## Local production-like compose

`docker-compose.production.yml` remains a local reference. Render uses the managed databases and the services defined in `render.yaml`; it does not run the compose file.
