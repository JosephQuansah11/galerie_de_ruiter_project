# Render production deployment

The Render blueprint deploys the public app, its dependent services and two
managed PostgreSQL databases:

- `galerie-app-db`: application PostgreSQL database
- `galerie-keycloak-db`: separate PostgreSQL database for Keycloak
- `galerie-keycloak`: public Keycloak service
- `galerie-ollama`: private Ollama model service
- `galerie-java-api`: Spring Boot API
- `galerie-frontend`: static React frontend with SPA rewrites

The blueprint used to declare `galerie-reconstruction-api`, a Python service that turned six
photographs into a 3D model, with a 1 GB data disk. Nothing called it - the frontend half of the
feature was removed before the gallery ever used it, and it ran with `RECONSTRUCTION_MODE=disabled` -
so it, its disk and its endpoints are gone. Syncing the blueprint deletes the Render service; the
models the gallery shows are `.glb` files an administrator uploads to `galerie-java-api`, which are
unrelated to it.

Both PostgreSQL databases use Render's current `basic-256mb` plan rather than
the retired `starter` plan. Review the database pricing and capacity in Render
before syncing; changing a plan can affect monthly costs.
Keycloak uses the `standard` web-service plan (2 GiB RAM) because its startup
exceeded the 512 MiB available on the `starter` plan. This service-plan change
increases costs; review the current price in Render before syncing.

## Keycloak

The live client in the running Keycloak (`movie_project_frontend_client`) must also list
`https://galeriederuiter.cloud-ip.cc/*` in **Valid redirect URIs** *and* in **Valid post logout
redirect URIs**. Keycloak refuses to return the browser to an origin its client does not declare, so
without them a sign-in started on the gallery's own domain fails at the redirect back - and the
sign-out that returns through `/logout` fails with it. The realm file in `keycloak/realms` is a
reference for a fresh import; a deploy does not re-import it into a Keycloak that already holds the
realm.

If the `galerie-keycloak` deploy fails with *"Failed to run import"* and *"Unrecognized field"*, the
realm file in `keycloak/realms` carries a field Keycloak's client representation does not know, and
the container exits before it serves anything - the fix is the field, not the service. *Keycloak
realm files* in the repository README says where each setting belongs and which test now catches it
before a deploy does.

The realm file defines the `USER` and `ADMIN` realm roles but grants neither of them automatically, so
a fresh Keycloak hands a new account no role at all. Nothing in the API needs `USER` any more - the
only rule that asked for it was `GET /api/me`, which now asks for a signed-in visitor - but the
gallery's own account needs `ADMIN` before the admin screens work, because those writes are gated on
it in the API. Assign it under *Users* → the account → *Role mapping* → *Assign role* → filter by
*realm roles* → `ADMIN`, then have that person sign out and back in: the role travels in the token
that was issued at sign-in, so the old token keeps saying what it said. Until then they are a
signed-in visitor with no role, which the app handles without sending a request it knows will be
refused (see *Accounts and profiles* in the frontend README).

The frontend also needs `VITE_GOOGLE_MAPS_API_KEY` (also `sync: false`): a browser key for the Maps
Embed API and the Geocoding API, restricted by HTTP referrer to
`https://galeriederuiter.cloud-ip.cc/*`. Without it the location page shows the address and a link
to Google Maps instead of a frame.

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
(it would make Keycloak's own frames declare a policy this site cannot give them,
and that is what broke sign-in), and for why `Clear-Site-Data` sits on `/logout`
rather than on the whole site.

## Secrets and first-time setup

1. Create or apply the blueprint from `render.yaml`; it sets Render's automatic
   deployment for each service.
2. Set these `galerie-keycloak` environment secrets in the Render dashboard:
   `KC_BOOTSTRAP_ADMIN_USERNAME` and `KC_BOOTSTRAP_ADMIN_PASSWORD`.
3. Set the same username/password as `KEYCLOAK_ADMIN_USERNAME` and
   `KEYCLOAK_ADMIN_PASSWORD` on `galerie-java-api`, and set
   `KEYCLOAK_ADMIN_CLIENT_ID` to `admin-cli`. The app uses them for Keycloak
   administration. The blueprint sets the application login name to
   `de-ruiter`; set `KEYCLOAK_REALM_ADMIN_PASSWORD` on `galerie-java-api` to provision that
   application user, and optionally set `KEYCLOAK_REALM_ADMIN_EMAIL`. Startup
   creates or updates the user in the `movie_project_keycloak` realm and assigns
   the application `ADMIN` realm role. Its login is `de-ruiter` and its display
   name is `De Ruiter`. This is not a Keycloak master-realm superadmin account.
4. The blueprint builds and runs Ollama as a private Docker service on the
   `pro` plan and persists model files on its mounted disk. On first startup it
   downloads `llama3.2:3b`; initial model download and warm-up can take several
   minutes.    The Java API resolves the Ollama service's internal host and port from the
   blueprint and connects over Render's private network. Review the
   service and persistent-disk pricing before syncing the blueprint. If you
   change `OLLAMA_MODEL`, update it on `galerie-ollama` and `galerie-java-api`
   to the same model; allow enough disk space for the selected model.
5. The Keycloak image imports the production realm and frontend client from
   `keycloak/realms/galerie-production-realm.json`, copied into the image using
   Keycloak's required `movie_project_keycloak-realm.json` import filename; no
   manual realm/client setup is required.

GitHub Actions generates temporary, random credentials for its isolated service
smoke test. These credentials are not used in production; Render's secrets must
be configured separately in its dashboard.

## Important production values

- Do not commit database passwords or Keycloak passwords.
- `sync: false` variables in `render.yaml` must be populated in Render's
  dashboard. In particular, set `KC_BOOTSTRAP_ADMIN_USERNAME`,
  `KC_BOOTSTRAP_ADMIN_PASSWORD`, `KEYCLOAK_ADMIN_USERNAME`,
  `KEYCLOAK_ADMIN_PASSWORD`, and `KEYCLOAK_REALM_ADMIN_PASSWORD`.
- The frontend's public origin is `SITE_URL=https://galeriederuiter.cloud-ip.cc` in
  `render.yaml`. `sitemap.xml`, the `Sitemap:` line in `robots.txt` and the `og:url`/`og:image`
  tags are built from it; without it the build falls back to the same origin in
  `site.config.mjs`. If it names a host a crawler cannot fetch, Search Console reports every URL
  in the sitemap as "Couldn't fetch".
- `FRONTEND_ORIGIN` on `galerie-java-api` is the browser origin allowed to call the API, so it names
  the domain the frontend is served on. The backend allows one frontend origin plus the localhost
  ports, so serving the app from a second hostname as well needs that hostname added to the list in
  `SecurityConfiguration`, not just to `render.yaml`.
- The frontend environment variables are build-time values for the static site. Trigger a frontend deploy after changing them.
- The frontend's public Keycloak settings are already declared in `render.yaml`:
  `VITE_KEYCLOAK_URL=https://galerie-keycloak.onrender.com`,
  `VITE_KEYCLOAK_REALM=movie_project_keycloak`, and
  `VITE_KEYCLOAK_CLIENT_ID=movie_project_frontend_client`. They are public
  client configuration, not secrets. The Webpack build injects these values
  from Render's build environment; deploy the frontend after changing them.
- `FRONTEND_ORIGIN` and the Keycloak issuer URL must match the final Render service URLs.
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
- Render health checks use the `movie_project_keycloak` realm's OpenID Connect
  metadata endpoint for Keycloak, and `/actuator/health` for Spring Boot. Keycloak's
  health endpoints are served on its separate management port by default, so Render
  checks the realm metadata on the public HTTP port instead.
- The frontend uses SPA fallback so React routes such as `/antiques/:id` work after refresh.

## Local production-like compose

`docker-compose.production.yml` remains a local reference. Render uses the managed databases and the services defined in `render.yaml`; it does not run the compose file.
