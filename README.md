# Galerie de Ruiter

Antiques, art, design, vintage, furniture and decor.

## Production Docker stack

The production Compose file runs the frontend, Spring API, Keycloak, the
reconstruction API, and two persistent PostgreSQL databases. Supply secrets
through the environment or an untracked `.env` file, then run:

```powershell
docker compose -f docker-compose.production.yml up --build -d
```

Required variables include `POSTGRES_PASSWORD`, `KEYCLOAK_DB_PASSWORD`,
`KEYCLOAK_ADMIN_USERNAME`, `KEYCLOAK_ADMIN_PASSWORD`, and
`KEYCLOAK_ADMIN_CLIENT_ID`. The app and Keycloak databases have separate
containers and persistent volumes.

The Render deployment in `render.yaml` builds the Spring API and Keycloak from
their Dockerfiles and uses Render-managed PostgreSQL databases. Render's
managed databases are the production PostgreSQL services; the Docker Compose
PostgreSQL containers are for deployments that use the Compose stack.

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
