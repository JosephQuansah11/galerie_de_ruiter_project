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

This flow can also run on Docker-enabled GitHub Actions runners and GitHub
Codespaces. GitHub repository hosting itself does not keep Docker containers or
databases running; public production deployments need a container host and
persistent PostgreSQL service, such as the resources declared in `render.yaml`.

## Production Docker stack

The production Compose file runs the frontend, Spring API, Keycloak, the
reconstruction API, and two persistent PostgreSQL databases. Supply required
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
Set `STRIPE_SUCCESS_URL` and `STRIPE_CANCEL_URL` to public frontend routes even
when Stripe payments are disabled.
The Compose stack publishes web services on all interfaces by default; set
`BIND_ADDRESS` only when an intentional host-interface restriction is needed.
The app and Keycloak databases have separate containers and persistent volumes.

`KEYCLOAK_ADMIN_USERNAME` and `KEYCLOAK_ADMIN_PASSWORD` are the Keycloak
bootstrap credentials used by the backend's Admin API client; they are not the
application administrator's login. The separate
`KEYCLOAK_REALM_ADMIN_USERNAME` (set to `De Ruiter` in the cloud blueprint) and
`KEYCLOAK_REALM_ADMIN_PASSWORD` provision or update that application user in the
`movie_project_keycloak` realm and assign the realm-level `ADMIN` role read by
the frontend. `KEYCLOAK_REALM_ADMIN_EMAIL` is optional. For local `bootRun`,
set `KEYCLOAK_REALM_ADMIN_USERNAME=De Ruiter` and the password in the process
environment or an untracked local environment file. Never commit passwords.

The Render deployment in `render.yaml` builds the Spring API and Keycloak from
their Dockerfiles and uses Render-managed PostgreSQL databases. Render's
managed databases are the production PostgreSQL services; the Docker Compose
PostgreSQL containers are for deployments that use the Compose stack.

GitHub Actions builds both the frontend and backend, runs backend tests, and
executes a Docker-backed startup smoke test. Unit tests use an in-memory
database; the smoke test starts the real PostgreSQL, Keycloak, and
reconstruction containers. Add repository Actions secrets `KEYCLOAK_ADMIN_USERNAME`,
`KEYCLOAK_ADMIN_PASSWORD`, and `KEYCLOAK_REALM_ADMIN_PASSWORD` for that smoke
test; the application username is set to `De Ruiter`. The check is skipped for
pull-request branches from forks, where GitHub withholds secrets. Render
auto-deploys the blueprint independently of the Actions workflow, so runtime
secrets must also be entered in the corresponding Render service settings (they
are not copied from GitHub Actions).

## Stripe bank payments

Stripe Checkout supports cards and eligible European bank methods including
iDEAL (bank selection), Bancontact, EPS and SEPA Direct Debit. Stripe filters
the available methods according to the customer's location and the Stripe
account's enabled payment methods. Enable the desired methods for both test
and live mode in the Stripe Dashboard's payment-method settings. Configure
`STRIPE_SECRET_KEY` and the checkout success/cancel URLs in the backend
environment.

## About page

The public `/about` page loads its Markdown content from `GET /api/about`.
Administrators can edit and save it at `/admin/about`; the backend restricts
updates to users with the `ADMIN` role.
