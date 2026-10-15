# Galerie de Ruiter

Antiques, art, design, vintage, furniture and decor.

## Run the application locally

Install Docker with the Compose plugin and Java 25, then start the backend with:

```powershell
.\gradlew.bat bootRun
```

On macOS/Linux, run `./gradlew bootRun`. The Gradle task starts the development
PostgreSQL and Keycloak containers, waits for them to be ready, and then starts
the reconstruction API and Spring Boot using the `dev` profile. The Keycloak development realm is imported
automatically. The import is assembled from
`keycloak/realms/movie_project_keycloak-realm.json`,
`keycloak/realms/movie_project_frontend_client.json`, and
`keycloak/realms/movie_project_client.json`. The adapter-specific
`keycloak/realms/keycloak.json` is not a realm-import file and is not used by
this flow. Local development credentials and persisted database volumes are
defined in `docker-compose.dev.yml`; do not reuse its defaults outside
development. Keycloak is published on `http://localhost:8082` by default
(override with `KEYCLOAK_HTTP_PORT` if needed). Point the frontend's
`VITE_KEYCLOAK_URL` to that address when running it locally. The reconstruction
API is available at `http://localhost:8000`; its mode defaults to `disabled`
until a local reconstruction command or external worker is configured.

Stop the dependencies with `.\gradlew.bat stopDevServices` (or
`./gradlew stopDevServices`). This keeps the database volumes. To remove the
containers and local data, run `docker compose -f docker-compose.dev.yml down
-v`.

### Sign in with Google

Visitors can sign in with a Google account instead of a password the gallery would have
to store. Google is an identity provider *inside* the gallery's Keycloak realm, so the
flow is still Keycloak's: the sign-in page offers a Google button, and the frontend
names the provider (`idpHint`), which sends the visitor straight to Google rather than
to Keycloak's own page with a Google button on it.

Two things are needed, and neither belongs in the repository:

1. A **Google Cloud OAuth client** (Google Cloud Console → *APIs & Services* →
   *Credentials* → *Create credentials* → *OAuth client ID* → *Web application*) with
   this authorized redirect URI:

   ```
   https://galerie-keycloak.onrender.com/realms/movie_project_keycloak/broker/google/endpoint
   ```

   and, for local development,
   `http://localhost:8082/realms/movie_project_keycloak/broker/google/endpoint`.

2. Those two values as environment variables. The API reads them on start and creates
   (or updates) the realm's Google provider from them, so rotating the secret or
   changing the scopes is a deploy rather than a visit to the Keycloak console:

   | Variable | Value |
   |---|---|
   | `GOOGLE_IDP_CLIENT_ID` | the OAuth client's id |
   | `GOOGLE_IDP_CLIENT_SECRET` | its secret |
   | `GOOGLE_IDP_REQUIRED` | `true` to fail the start when the two above are missing (default `false`) |

   With neither value set the API leaves the realm exactly as it was, so a deployment
   that does not want Google sign-in is unaffected — but the Google button is still on
   the sign-in page, and it then leads to a Keycloak error page. That is what
   `GOOGLE_IDP_REQUIRED` is for. `KeycloakGoogleIdentityProviderProvisioner` does the
   provisioning and `KeycloakGoogleIdentityProviderProvisionerTest` pins what it writes
   into the realm.

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

## Production Docker stack

The production Compose file runs the frontend, Spring API, Keycloak, Ollama,
the reconstruction API, and two persistent PostgreSQL databases. Supply required
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
build (`VITE_JAVA_API_URL`, `VITE_JAVA_BACKEND_URL`, `VITE_API_URL`,
`VITE_KEYCLOAK_URL`, `VITE_RECONSTRUCTION_API_URL`, and `VITE_PYTHON_API_URL`).
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
starts PostgreSQL, Keycloak, and the reconstruction containers with temporary
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
