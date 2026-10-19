# Galerie de Ruiter

Antiques, art, design, vintage, furniture and decor.

## Run the application locally

Install Docker with the Compose plugin and Java 25, then start the backend with:

```powershell
.\gradlew.bat bootRun
```

On macOS/Linux, run `./gradlew bootRun`. The Gradle task starts the development
PostgreSQL and Keycloak containers, waits for them to be ready, and then starts
Spring Boot using the `dev` profile. The Keycloak development realm is imported
automatically. The import is assembled from
`keycloak/realms/movie_project_keycloak-realm.json`,
`keycloak/realms/movie_project_frontend_client.json`, and
`keycloak/realms/movie_project_client.json`. The adapter-specific
`keycloak/realms/keycloak.json` is not a realm-import file and is not used by
this flow. Local development credentials and persisted database volumes are
defined in `docker-compose.dev.yml`; do not reuse its defaults outside
development. Keycloak is published on `http://localhost:8082` by default
(override with `KEYCLOAK_HTTP_PORT` if needed). Point the frontend's
`VITE_KEYCLOAK_URL` to that address when running it locally.

Stop the dependencies with `.\gradlew.bat stopDevServices` (or
`./gradlew stopDevServices`). This keeps the database volumes. To remove the
containers and local data, run `docker compose -f docker-compose.dev.yml down
-v`.

Keycloak also has to be able to send the browser back to the gallery. The client the frontend signs
in with (`movie_project_frontend_client`) must list the gallery's origins
(`https://galeriederuiterantieks.gripe/*` and, while it stays live, `https://galeriederuiter.cloud-ip.cc/*`)
in its **Valid redirect URIs** and in its **Valid post logout redirect URIs**. The realm file in
`keycloak/realms` carries them for a fresh import, but a deploy does not re-import a realm that
already exists, so the running Keycloak is edited by hand (*RENDER.md* has the steps).

### Keycloak realm files

The Keycloak image imports `keycloak/realms/galerie-production-realm.json`
(`--import-realm`), and `prepareDevKeycloakRealm` builds the development import from the realm file
and the two client exports beside it. Both paths end in Keycloak's own JSON reader, which **fails on
a field its representation does not know** - and because `--import-realm` parses the file before it
decides whether the realm is already there, that failure is not "the import was skipped": it is
*"Failed to run import ... Exited with status 1"* and a container that never serves.

Two things follow from that.

**Fields live where the representation puts them, not where the admin console shows them.** The
post-logout redirect URIs are the clearest example: the console has a *Valid post logout redirect
URIs* box, but a client representation has no `postLogoutRedirectUris` field. Keycloak keeps them in
the client's attributes:

```json
"attributes": {
  "post.logout.redirect.uris": "https://galeriederuiterantieks.gripe/*##https://galeriederuiter.cloud-ip.cc/*##https://galerie-frontend.onrender.com/*"
}
```

`##` separates several URIs inside that one string, and an array there is rejected with *"Cannot
deserialize value of type java.lang.String from Array value"*. A top-level `postLogoutRedirectUris`
field is what stopped the deploy of 15 October 2026; `KeycloakRealmFilesTest` now reads every file
in `keycloak/realms` with Keycloak's own classes and a mapper that refuses unknown fields, so the
same mistake fails a test run instead - and `build.gradle` declares those files as inputs of the
`test` task, because Gradle tracks a test by its classes and would otherwise answer from the
previous run.

**The import only fills an empty Keycloak.** It runs with the `IGNORE_EXISTING` strategy, so a realm
that is already in the database is left exactly as it is. Editing a realm file therefore changes what
a *fresh* install gets; the running realm is changed in the console (or by the API's own
provisioners, which is why the realm's administrator is set from the environment rather than
from the file).

### Local chat model

The Spring API talks to the Ollama service at `OLLAMA_BASE_URL` (default
`http://localhost:11434`) and always uses the single model named by
`OLLAMA_MODEL` (default `llama3.2:3b`) for both the warm-up and every prompt of
a session. When that model is not installed yet, the API downloads it once in
the background the first time the chat page asks for it and reports progress on
`GET /api/chat/status`, so a fresh machine never needs a manual `ollama pull`.
The downloaded model stays in Ollama's own model store and is reused by later
sessions. `OLLAMA_KEEP_ALIVE` (default `30m`) keeps the loaded model resident
between prompts, and `OLLAMA_TOUCH_INTERVAL` (default `10m`) refreshes that
while the chat page stays open, so a visitor keeps talking to the same loaded
model instead of paying a cold start again. Set `OLLAMA_AUTO_PULL=false` to
disable the automatic download, and `OLLAMA_PULL_RETRY` (default `60s`) to
change how long a failed download waits before it is retried.

This flow can also run on Docker-enabled GitHub Actions runners and GitHub
Codespaces. GitHub repository hosting itself does not keep Docker containers or
databases running; public production deployments need a container host and
persistent PostgreSQL service, such as the resources declared in `render.yaml`.

## API response headers

The API serves the gallery's photographs, avatars and 3D models to a frontend that runs on another
origin - the static site on the gallery's own domain - so it has one thing to say about that
relationship itself:

| Header | Value | Why |
|---|---|---|
| `Cross-Origin-Resource-Policy` | `cross-origin` | The gallery's own pages are cross-origin to this service, so `same-origin` and `same-site` would block every photograph. `cross-origin` is what stops a page that sets `Cross-Origin-Embedder-Policy: require-corp` from having the gallery's images refused as resources it may not load. |

`SecurityConfiguration` sets it on every response, and `CrossOriginResourcePolicyTest` pins both the
value and the two values that would break the catalogue. Everything else the API sends is Spring
Security's default (`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`) plus the `nosniff`
Render adds itself.

**What `cross-origin` costs:** another site may embed the gallery's photographs. That is the trade,
and it is the one the gallery wants - its images are public reads and its links are meant to be
shareable. A policy that allowed only the gallery would have to be `same-site`, which compares
registrable domains and therefore needs the API and the frontend to share one (for example
`api.galeriederuiterantieks.gripe` beside `www.galeriederuiterantieks.gripe`). Nothing needs that today.

## Memory

The API runs on a small instance, so two things are kept out of the heap on purpose: server sessions
and photographs.

- **No servlet session.** Every request is proved by its bearer token, and the CSRF token is a
  cookie; `SecurityConfiguration` sets `SessionCreationPolicy.STATELESS`. Under the default policy
  Spring saves an unauthenticated request in an `HttpSession` before it answers `401`, which gives
  every crawler - and every browser whose tab expired - a session that stays in the container until
  it times out. `UserControllerSecurityTest` fails if a refused request leaves a session behind.
- **List endpoints count in the database, not in memory.** `/api/categories` is drawn on every page
  and must never initialize `Category.antiques`: that reads every piece, including the legacy
  photograph column, only to call `size()`. `CategoryRepository.findAllWithCounts()` asks PostgreSQL
  for the count, and `CategoryApiTest` fails if a category request loads any entity. The dashboard
  does the same through `AntiqueRepository.findStatsRows()`, and `GalleryStatsServiceTest` fails if
  it falls back to `findAll()`, which reads every piece row - legacy photographs included - to count
  them.
- **A listing that needs an image asks an image endpoint.** Photograph bytes leave the API one
  picture at a time (`/api/antiques/{id}/image/{imageId}` and its thumbnail), never as a side effect
  of naming the collection.

## Production Docker stack

The production Compose file runs the frontend, Spring API, Keycloak, Ollama,
and two persistent PostgreSQL databases. Supply required
credentials and public service URLs through the environment or an untracked
`.env` file, then run:

```powershell
docker compose -f docker-compose.production.yml up --build -d
```

Required variables include `POSTGRES_PASSWORD`, `KEYCLOAK_DB_PASSWORD`,
`KEYCLOAK_ADMIN_USERNAME`, `KEYCLOAK_ADMIN_PASSWORD`, `KEYCLOAK_ADMIN_CLIENT_ID`,
`KEYCLOAK_REALM_ADMIN_USERNAME`, and `KEYCLOAK_REALM_ADMIN_PASSWORD`,
`PUBLIC_FRONTEND_ORIGIN`, `PUBLIC_KEYCLOAK_URL`,
`PUBLIC_KEYCLOAK_ISSUER_URI`, and the public frontend URLs used by the Vite
build (`VITE_JAVA_API_URL`, `VITE_JAVA_BACKEND_URL`, `VITE_API_URL`, and
`VITE_KEYCLOAK_URL`).
The Compose stack builds and runs Ollama as a container, pulls `llama3.2:3b`
on first start, and keeps model files in a persistent volume. The Ollama
container is not considered healthy until the configured model is available,
so the Java API waits for the model before starting. Set `OLLAMA_MODEL` to
another model if needed; the Ollama service and Java API use the same value.
The Compose stack publishes web services on all interfaces by default; set
`BIND_ADDRESS` only when an intentional host-interface restriction is needed.
The app and Keycloak databases have separate containers and persistent volumes.

`KEYCLOAK_ADMIN_USERNAME` and `KEYCLOAK_ADMIN_PASSWORD` are the Keycloak
bootstrap credentials used by the backend's Admin API client; they are not the
application administrator's login. The separate `KEYCLOAK_REALM_ADMIN_USERNAME` (set to `de-ruiter` in the cloud
blueprint) and `KEYCLOAK_REALM_ADMIN_PASSWORD` provision or update that
application user in the `movie_project_keycloak` realm and assign the
realm-level `ADMIN` role read by the frontend. The account's display name is
`De Ruiter`; `KEYCLOAK_REALM_ADMIN_FIRST_NAME` and
`KEYCLOAK_REALM_ADMIN_LAST_NAME` are optional. `KEYCLOAK_REALM_ADMIN_EMAIL` is
also optional. For local `bootRun`, set the username and password in the
process environment or an untracked local environment file. Never commit
passwords.

The Render deployment in `render.yaml` builds the Spring API and Keycloak from
their Dockerfiles and uses Render-managed PostgreSQL databases. Render's
managed databases are the production PostgreSQL services; the Docker Compose
PostgreSQL containers are for deployments that use the Compose stack.

GitHub Actions builds both the frontend and backend, runs backend tests, and
executes Docker-backed development and production-profile smoke tests. The
production-profile test runs against an isolated PostgreSQL 17 service with
Open Session in View disabled, exercises the public catalogue, admin category
and antique writes, image persistence, CSRF/CORS behavior, chat context, and
appointment persistence. It substitutes a local Ollama HTTP stub and does not
connect to or write to production services. The development startup smoke test
starts PostgreSQL and Keycloak with temporary
credentials. Neither workflow requires production secrets. Render auto-deploys
the blueprint independently of the Actions workflow, so runtime secrets must be
entered in the corresponding Render service settings.

## Purchases

The application does not process online payments. Contact the gallery to
arrange purchases. The gallery chatbot uses the Ollama container service.

## About page

The public `/about` page loads its Markdown content from `GET /api/about`.
Administrators can edit and save it at `/admin/about`; the backend restricts
updates to users with the `ADMIN` role.
