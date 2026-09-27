# Render production deployment

The Render blueprint deploys four production concerns:

- `galerie-app-db`: application PostgreSQL database
- `galerie-keycloak-db`: separate PostgreSQL database for Keycloak
- `galerie-keycloak`: public Keycloak service
- `galerie-java-api`: Spring Boot API
- `galerie-frontend`: static React frontend with SPA rewrites

## Required dashboard setup

1. Create or apply the blueprint from `render.yaml`.
2. In `galerie-keycloak`, set `KEYCLOAK_ADMIN` and `KEYCLOAK_ADMIN_PASSWORD`.
3. Open Keycloak at `https://galerie-keycloak.onrender.com` and create the `galerie` realm.
4. Create a public client named `galerie-frontend` with:
   - Valid redirect URI: `https://galerie-frontend.onrender.com/*`
   - Web origin: `https://galerie-frontend.onrender.com`
5. Configure the `USER` and `ADMIN` realm roles expected by the Spring converter.
6. Set the frontend `VITE_KEYCLOAK_CLIENT_ID` to `galerie-frontend`.
7. Set `STRIPE_SECRET_KEY` on `galerie-java-api` and use Stripe test keys until production verification is complete.

## Important production values

- Do not commit database passwords, Keycloak passwords, or Stripe keys.
- The frontend environment variables are build-time values for the static site. Trigger a frontend deploy after changing them.
- `FRONTEND_ORIGIN`, Stripe success/cancel URLs, and Keycloak issuer URL must match the final Render service URLs.
- The Java API uses the managed PostgreSQL connection values supplied by Render and listens on the Render `PORT`.
- The frontend uses Nginx SPA fallback so React routes such as `/antiques/:id` and `/checkout/success` work after refresh.

## Local production-like compose

`docker-compose.production.yml` remains a local reference. Render uses the managed databases and the services defined in `render.yaml`; it does not run the compose file.
