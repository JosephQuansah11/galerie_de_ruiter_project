# Render production deployment

The Render blueprint deploys the public app, its dependent services and two
managed PostgreSQL databases:

- `galerie-app-db`: application PostgreSQL database
- `galerie-keycloak-db`: separate PostgreSQL database for Keycloak
- `galerie-keycloak`: public Keycloak service
- `galerie-reconstruction-api`: reconstruction API with a persistent data disk
- `galerie-java-api`: Spring Boot API
- `galerie-frontend`: static React frontend with SPA rewrites

Both PostgreSQL databases use Render's current `basic-256mb` plan rather than
the retired `starter` plan. Review the database pricing and capacity in Render
before syncing; changing a plan can affect monthly costs.
Keycloak uses the `standard` web-service plan (2 GiB RAM) because its startup
exceeded the 512 MiB available on the `starter` plan. This service-plan change
increases costs; review the current price in Render before syncing.

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
4. Set `OLLAMA_BASE_URL` on `galerie-java-api` to the base URL of an Ollama API
   reachable from the Java service, and ensure the configured model is
   available there. The blueprint leaves this environment value for you to
   supply because Render does not host the model runtime in this stack. The
   default model is `llama3.2:3b`; set `OLLAMA_MODEL` if using another model.
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
- The frontend environment variables are build-time values for the static site. Trigger a frontend deploy after changing them.
- The frontend's public Keycloak settings are already declared in `render.yaml`:
  `VITE_KEYCLOAK_URL=https://galerie-keycloak.onrender.com`,
  `VITE_KEYCLOAK_REALM=movie_project_keycloak`, and
  `VITE_KEYCLOAK_CLIENT_ID=movie_project_frontend_client`. They are public
  client configuration, not secrets. The Webpack build injects these values
  from Render's build environment; deploy the frontend after changing them.
- `FRONTEND_ORIGIN` and the Keycloak issuer URL must match the final Render service URLs.
- The chatbot sends requests through `galerie-java-api`. Set the `OLLAMA_BASE_URL`
  secret/environment value to a running Ollama endpoint that the backend can
  reach; ensure `OLLAMA_MODEL` is installed at that endpoint. The Render
  blueprint cannot run the language model itself.
- The Java API receives the `galerie-app-db` internal host, port, database, username, and password through the `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_NAME`, `DATABASE_USERNAME`, and `DATABASE_PASSWORD` variables. The Spring profile assembles these into a JDBC URL.
- If you created a standalone Java web service instead of the `galerie-java-api` blueprint service, add those five variables and link each to the corresponding **internal** property of `galerie-app-db` in that service's environment. Alternatively, set `DATABASE_URL` to a valid JDBC URL beginning `jdbc:postgresql://`. Ensure the database and web service are in the same Render region.
- The Java API listens on Render's `PORT`.
- Render health checks use `/health` for the reconstruction service, the
  `movie_project_keycloak` realm's OpenID Connect metadata endpoint for
  Keycloak, and `/actuator/health` for Spring Boot. Keycloak's health endpoints
  are served on its separate management port by default, so Render checks the
  realm metadata on the public HTTP port instead.
- The frontend uses SPA fallback so React routes such as `/antiques/:id` work after refresh.

## Local production-like compose

`docker-compose.production.yml` remains a local reference. Render uses the managed databases and the services defined in `render.yaml`; it does not run the compose file.
