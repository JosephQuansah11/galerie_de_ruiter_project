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
- **`public/robots.txt`** — everything that answers with the sign-in page (`/admin`, `/antiques`,
  `/cart`, `/wishlist`, `/profile`, `/preferences`) is closed to crawlers. `/login` and
  `/register` stay crawlable on purpose: they carry a `noindex` tag and a crawler that may not
  fetch them never sees it.
- **`scripts/generate-sitemap.mjs`** — runs after webpack (`npm run build`) and writes
  `dist/sitemap.xml` plus the absolute `Sitemap:` line in `dist/robots.txt`. It lists the pages
  a visitor reaches without an account: `/dashboard`, `/about`, `/map` and `/dashboard/chat`.

**What a visitor may do.** The landing page, the gallery story, the pop-up's address and the
concierge chat are readable without an account, and they are the pages a crawler may index.
Acting on the collection is what needs one: `/antiques`, the wishlist, the cart and the profile
screens sit behind `RequireAccount` in `src/ProtectedRoutes.tsx`, which sends the visitor to the
sign-in page with the page they wanted, and the sign-in page says why (`signInRequired`). The
navigation follows the same line: `src/components/NavigationLinks.tsx` shows a visitor the three
public destinations and hides the rest rather than offering a link that only bounces them.

The site's public origin lives in `site.config.mjs`, in one place, because two build steps need
it: the sitemap (and the `Sitemap:` line in `robots.txt`) and the absolute `og:url`/`og:image`
of the social preview tags. It defaults to `https://galeriederuiter.cloud-ip.cc`, so a deploy
that sets nothing still publishes the right URLs; `SITE_URL` overrides it for a staging deploy or
a local build:

```bash
SITE_URL=http://localhost:3000 npm run build
# or, for the container:
docker build --build-arg SITE_URL=https://www.example.be ./galerie_de_ruiter_frontend_app
```

`render.yaml` sets `SITE_URL` for the static site. Like the other frontend values in it, it is
read while the bundle is built, so changing it needs a new deploy.

The `og:image` a shared link shows is `logo512.png`. A 1200×630 image in `public/` pointed at
from `index.html` makes for a richer preview, which is what a shared link gets instead of a
square logo.

### Google Search Console

A sitemap is only as good as the origin inside it. URLs a crawler cannot fetch - `localhost`
among them - come back as *Couldn't fetch*, and the pages stay out of the results even though
the site itself is reachable. Check what a deploy actually published before submitting anything:

```bash
curl -s https://galeriederuiter.cloud-ip.cc/sitemap.xml | grep '<loc>'
curl -s https://galeriederuiter.cloud-ip.cc/robots.txt
```

Both should name the public origin. Then, in Search Console, submit
`https://galeriederuiter.cloud-ip.cc/sitemap.xml` under *Sitemaps*, and use *URL inspection* →
*Request indexing* for `/dashboard`, `/about` and `/map`.

Those are the pages that can be indexed. Everything else needs an account and answers with the
sign-in page, which carries `noindex`, so a crawler that follows `/antiques` finds the login page
and leaves; `robots.txt` closes those paths so it does not spend the crawl budget finding that
out. Indexing the collection itself means making it readable without an account - the note below
says how.

The host is a free `cloud-ip.cc` subdomain. Search engines give such hostnames less weight than
a domain you own, and the provider can reassign one, so a custom domain is the durable answer;
nothing in the build depends on which one it is, because `site.config.mjs` is the only place that
names it.

When the collection opens to visitors, remove the `/antiques` line from `robots.txt`, drop
`/antiques` from the `RequireAccount` group in `src/ProtectedRoutes.tsx` and add the pieces to
`publicPages` in the sitemap script (the API's `GET /api/antiques` lists them, so the script can
fetch them at build time). The API already answers `GET /api/antiques` without a token, so this
is a frontend decision, not a backend one.

## Stylesheets

The gallery's CSS lives in `src/styles` and is imported once, from `src/index.tsx`. `App.scss` is
the entry point and does nothing but import the rest, in the order the rules have to cascade in:
Bootstrap and the navigation bar first, then the page chrome, then the design layer
(`_antique-theme`) and finally the reset that used to be a separate `index.css`. **That order is
the cascade order of the compiled CSS, so an import moved in `App.scss` changes the rendering.**

Two rules keep the folder navigable:

- **No stylesheet is longer than 50 lines.** `App.scss`'s own rules are the `_shell-*.scss` parts,
  the design layer is `_antique-theme-*.scss`, and each of the smaller areas has its own numbered
  parts (`_admin-01-…`, `_profile-02-…`). A part is imported by the index that carries its area's
  name (`_shell.scss`, `_antique-theme.scss`, `_admin.scss`, …), and the number in the file name is
  the position of its rules in the cascade. Adding a rule means editing the part that owns that
  screen; a new part needs one `@import` line in the index, placed where the rules belong.
- **Every file is reachable from `App.scss`.** `src/styles/stylesheetBudget.test.ts` fails the
  suite when a stylesheet grows past 50 lines or when a part is not imported by any index, which
  would silently drop its rules from the bundle.

The parts were cut at rule boundaries from the original single files, and their text was copied
verbatim, so splitting them did not change the compiled CSS: only long `@media` blocks were
emitted as several consecutive blocks with the same query, which renders identically.

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
