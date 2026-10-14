# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Search engines

The app is one HTML page, so what a crawler can reach is decided in three places:

- **`src/hooks/usePageMeta.ts`** — every page sets its own `<title>`, `<meta name="description">`,
  `<link rel="canonical">` and Open Graph tags. Pages call it with their own translated copy;
  the strings live in `pageMetaLabels` in `src/i18n.ts`.
- **`public/robots.txt`** — everything behind an account (`/admin`, `/antiques`, `/about`,
  `/map`, `/cart`, `/wishlist`, `/profile`, `/preferences`) is closed to crawlers, because
  those routes answer with the sign-in page. `/login` and `/register` stay crawlable on
  purpose: they carry a `noindex` tag and a crawler that may not fetch them never sees it.
- **`scripts/generate-sitemap.mjs`** — runs after webpack (`npm run build`) and writes
  `dist/sitemap.xml` plus the absolute `Sitemap:` line in `dist/robots.txt`. It lists the pages
  a visitor reaches without an account: `/dashboard` and `/dashboard/chat`.

The site's public origin is not in the source. Pass it at build time, otherwise the sitemap
points at `http://localhost:3000` and the script says so:

```bash
SITE_URL=https://www.example.be npm run build
# or, for the container:
docker build --build-arg SITE_URL=https://www.example.be ./galerie_de_ruiter_frontend_app
```

`SITE_URL` is also what turns the `og:url` and `og:image` tags in `index.html` into the
absolute URLs a social preview needs. Add a 1200×630 image to `public/` and point
`og:image` at it for richer previews.

When the collection opens to visitors, remove the `/antiques` and `/about` lines from
`robots.txt` and add the pieces to `publicPages` in the sitemap script (the API's
`GET /api/antiques` lists them, so the script can fetch them at build time).

## Security headers

`nginx.conf` sends these on every response (the container deployment; see below for the static
one):

| Header | Value |
|---|---|
| `Content-Security-Policy` | `default-src 'self'; script-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: <API>; connect-src 'self' <API> <Keycloak> https://nominatim.openstreetmap.org; frame-src https://www.openstreetmap.org <Keycloak>; worker-src 'self' blob:; manifest-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'` |
| `Content-Security-Policy-Report-Only` | `require-trusted-types-for 'script'; trusted-types default` |
| `Strict-Transport-Security` | `max-age=31536000` |
| `X-Frame-Options` | `DENY` |
| `Cross-Origin-Opener-Policy` | `same-origin` |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |

`script-src 'self'` — no `'unsafe-inline'`, no `'unsafe-eval'` — is what makes the policy worth
having: the app ships no inline script and no `eval`. The one inline handler the page used to
have (the `onload` that flipped the font stylesheet from `media="print"`) is now done by the
bundle in `src/index.tsx`.

**The API and Keycloak origins come from the environment**, so the policy always matches the
bundle: the image sets `CSP_API_ORIGIN` and `CSP_KEYCLOAK_ORIGIN` from the same build arguments
the frontend was built with, and `docker-compose.production.yml` passes them explicitly. Override
them if the browser-facing origins differ from the ones the frontend was built against.

### The static deployment (Render)

`render.yaml` publishes the frontend as a Render **static site**, which does not run nginx, so
the headers above have to be set there — Render's dashboard, under *Headers* for the service.
Use the same values with `https://galerie-java-api.onrender.com` as `<API>` and
`https://galerie-keycloak.onrender.com` as `<Keycloak>`. HSTS is added by Render on its own
domains.

### Trusted Types is staged in report-only mode

`require-trusted-types-for 'script'` would currently break the app, and the report-only policy is
how that was established rather than guessed: loading the built site with the enforced policy
above and a `report-uri` collector reports exactly one violation, from webpack's own chunk
loader:

```
require-trusted-types-for <- trusted-types-sink
  script-sample: "HTMLScriptElement src|/js/437.3e9055e85ae60a2cddd6.js"
```

That is `script.src = …` for a lazily loaded route, which every navigation needs. To enforce it:

1. add `output.trustedTypes: { policyName: "galerie" }` to `webpack.config.js`, so webpack
   creates and uses a policy for the script elements it adds;
2. put `require-trusted-types-for 'script'; trusted-types 'default' galerie` into the enforced
   `Content-Security-Policy` in `nginx.conf`;
3. re-run the collector against the built site on the landing page **and** on a lazy route
   (`/login`), plus a page that mounts the 3D viewer, and only then remove the report-only header.

### Rolling out HSTS

`max-age=31536000` is what the audit wants. If you are not certain every subdomain of the domain
can serve HTTPS, start with a low value (for example `max-age=300`), raise it once you are sure,
and add `includeSubDomains` only when all subdomains are ready.

## Learn More


You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).
