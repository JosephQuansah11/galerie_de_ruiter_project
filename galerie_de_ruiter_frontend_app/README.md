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

The app is one HTML page, so what a crawler can reach is decided in five places:

- **`index.html`** — the document a crawler that runs nothing is served. It carries the
  description, the structured data (an `ArtGallery` and a `WebSite` node in one
  `application/ld+json` block), the landing page's own copy inside `#root`, and one `<h1>`.
  The copy is not written for a search engine: it is the gallery's account of itself, in the
  gallery's language, for the crawler and for the visitor whose browser cannot run the bundle, and
  React replaces it on the first render (see `src/FirstScreen.test.tsx`). The street address and
  the opening hours are deliberately absent from the copy *and* from the structured data: they are
  records the gallery edits and they are shown on `/map` and `/about`, so a copy in the document
  would be the copy that goes stale. `src/staticDocument.test.ts` pins all of it, including that
  the description is the one the landing page sets at runtime (`metaHomeDescription`).
- **`src/hooks/usePageMeta.ts`** — every page sets its own `<title>`, `<meta name="description">`,
  `<link rel="canonical">` and Open Graph tags. Pages call it with their own translated copy;
  the strings live in `pageMetaLabels` in `src/i18n.ts`. The canonical URL is built from the
  configured origin rather than from the host that served the page, so the copy Render also serves
  on its `onrender.com` domain never declares itself canonical. `index.html` deliberately carries
  none: it is the document every route is served, so a canonical written into it names one URL for
  all of them, and the pages it named were reported as *canonical to a different URL* — which asks
  a search engine to drop them from the index. `src/staticDocument.test.ts` checks both ends: the
  document has none, and every page declares one that the router actually serves.
- **`public/robots.txt`** — everything that answers with the sign-in page (`/admin`, `/antiques/`
  — the pieces, not the list — `/cart`, `/wishlist`, `/profile`, `/preferences`) is closed to
  crawlers. `/login` and
  `/register` stay crawlable on purpose: they carry a `noindex` tag and a crawler that may not
  fetch them never sees it.
- **`scripts/generate-sitemap.mjs`** — runs after webpack (`npm run build`) and writes
  `dist/sitemap_index.xml` (and the same document at `dist/sitemap.xml`, the address earlier
  submissions used, so it keeps answering) plus the absolute `Sitemap:` and `Agentmap:` lines in
  `dist/robots.txt`.
  It lists the pages
  a visitor reaches without an account: `/`, `/antiques`, `/about`, `/map` and `/chat`.
- **the routes, on both deployments** — `render.yaml` names the application's routes one by one and
  `nginx.conf` names them in one regular expression, so a path the router does not draw is a 404
  rather than the landing page with a 200. `public/404.html` (with `public/404.css`) is the page a
  visitor gets, and `src/spaRoutes.test.ts` reads the router and both files, so a route that no rule
  covers fails a test instead of 404ing for a visitor who follows a deep link. The addresses that
  are *not* pages are permanent redirects on both: `/home` is the landing page under its old name
  and `/dashboard` its predecessor, and each sends the visitor to the URL that is canonical, so two
  addresses never compete for one page in the index.

**What a visitor may do.** The landing page, the gallery story, the pop-up's address, the concierge
chat and the first page of the collection are readable without an account, and they are the pages a
crawler may index. Everything past that needs one: a piece's own page, the pages after the first of
the collection list, the wishlist, the cart and the profile screens sit behind `RequireAccount` in
`src/ProtectedRoutes.tsx`, which sends the visitor to the sign-in page with the page they wanted,
and the sign-in page says why (`signInRequired`). The collection is gated in three places rather
than one, because the list is public and the actions are not: `src/pages/antiques/CataloguePage.tsx`
gives a visitor the first page and an invitation to sign in where the paging controls would be,
`src/pages/antiques/AntiqueRow.tsx` sends the save and basket buttons to the sign-in page with the
list as the page to come back to, and the like control lives on a piece's own page, which a visitor
never reaches. The navigation follows the same line: `src/components/NavigationLinks.tsx` shows a
visitor the four public destinations and hides the rest rather than offering a link that only
bounces them.

The site's public origin lives in `site.config.mjs`, in one place, because three build steps need
it: the sitemap (and the `Sitemap:` line in `robots.txt`), the absolute `og:url`/`og:image` of the
social preview tags, and the canonical URL every page declares — webpack hands that one to the
bundle as `import.meta.env.SITE_URL`. The static document declares the same origin, so a crawler
that runs nothing still reads it. It defaults to `https://galeriederuiter.cloud-ip.cc`, so a deploy
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
curl -s https://galeriederuiter.cloud-ip.cc/sitemap_index.xml | grep '<loc>'
curl -s https://galeriederuiter.cloud-ip.cc/robots.txt
```

Both should name the public origin. Then, in Search Console, submit
`https://galeriederuiter.cloud-ip.cc/sitemap_index.xml` under *Sitemaps*, and use *URL inspection* →
*Request indexing* for `/`, `/about` and `/map`.

Those are the pages that can be indexed. Everything else needs an account and answers with the
sign-in page, which carries `noindex`, so a crawler that follows `/antiques` finds the login page
and leaves; `robots.txt` closes those paths so it does not spend the crawl budget finding that
out. Indexing the collection itself means making it readable without an account - the note below
says how.

The host is a free `cloud-ip.cc` subdomain. Search engines give such hostnames less weight than
a domain you own, and the provider can reassign one, so a custom domain is the durable answer;
nothing in the build depends on which one it is, because `site.config.mjs` is the only place that
names it.

The collection is half open today: the list is public and belongs in the sitemap, while a piece's own
page is not. Opening the pieces to visitors means removing the `Disallow: /antiques/` line from
`robots.txt`, dropping `/antiques/:id` from the `RequireAccount` group in `src/ProtectedRoutes.tsx`
and adding the pieces to `publicPages` in the sitemap script (the API's `GET /api/antiques` lists
them, so the script can fetch them at build time). The API already answers `GET /api/antiques`
without a token, so this is a frontend decision, not a backend one.

## Agent discovery

Two files describe the gallery to AI agents. Neither is generated: they are written by hand in
`public/` and copied to the site root as they are.

- **`public/llms.txt`** follows the [llms.txt](https://llmstxt.org/) format: an H1, then sections of
  Markdown links to the pages a visitor can read without an account — and the fact that the
  catalogue is not one of them. Lighthouse's audit fails a file with no H1, no Markdown link, or
  fewer than 50 characters, so `src/agentDiscovery.test.ts` pins all three.
- **`public/.well-known/ai-catalog.json`** is the Agentic Resource Discovery manifest: a `specVersion`
  and a `host` block (the AI Catalog envelope) around `entries[]`, where each entry carries a
  domain-anchored URN (`urn:air:<host>:<namespace>:<name>`), a `displayName`, an IANA media type and
  exactly one of `url` or `data`. The same document is served at `/.well-known/ard.json`, the path
  the current ARD specification names. ARD reads only `entries` and ignores the envelope, so one
  document satisfies both readings, and the test asserts the two files are byte-identical so they
  cannot drift apart.

It is advertised three ways: the `<link>` tags in `index.html`, an `Agentmap:` line in
`dist/robots.txt`, and the conventional well-known path itself. The document carries two relations
because the specification renamed one: `rel="ai-catalog"` is the AI Catalog relation, and
`rel="ard"` is the one Agentic Resource Discovery v0.91 names in its place. The `Agentmap:` line is
written by `scripts/generate-sitemap.mjs` rather than by hand, because the directive takes an
absolute URL and the origin is only known at build time - and it names `/.well-known/ard.json`, the
path the current specification requires a consumer to consult, rather than the predecessor path it
supersedes.
`/.well-known/*` is also the one place the site sends `Access-Control-Allow-Origin: *` and
`Cross-Origin-Resource-Policy: cross-origin` (see *Security headers*), because a crawler reading the
manifest from its own origin makes a cross-origin request.

**Why the manifest was reported as malformed.** This is a single-page application: `render.yaml`
rewrites `/*` to `/index.html`, and `nginx.conf` falls back to it with `try_files`. A path with no
file behind it therefore answers `200` with the HTML document, so a crawler that asked for
`ai-catalog.json` before it existed got `<!DOCTYPE html>` where JSON was expected — *"Malformed JSON
in manifest: SyntaxError: Unexpected token '<'"*. Render and nginx both serve a real file before the
fallback, so shipping the file is the whole fix; `src/agentDiscovery.test.ts` fails if the file, its
fields, the paths that advertise it, or the webpack `globOptions.dot` that copies a dot directory go
missing.

The gallery runs no MCP server and publishes no agent card, so the catalog lists one entry: the guide
above, typed `text/markdown`. An entry for an MCP server or an agent card goes in when there is one
to point at — the specification is explicit that a catalogue listing resources that do not resolve is
worse than a small one.

The two forms a visitor can use without an account — the concierge composer and the appointment
picker in the chat — carry WebMCP declarative annotations (`toolname` and `tooldescription` on the
form, `toolparamdescription` on each control), so an agent can find them as tools and fill them in.
Chrome reads the attributes directly and nothing else changes; no form carries `toolautosubmit`, so
the visitor still checks and submits. `src/webmcp.d.ts` declares the attributes for TypeScript, which
knows no such attribute on a `<form>`.

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

## Speed

The first paint of the landing page is what a mobile visitor waits for, so the pieces that hold it
back are the ones this repository is careful about. Measured on the deployed site with Lighthouse's
mobile settings the first contentful paint was 2.8 s and the largest contentful paint 5.6 s, and
four things were behind that. All four are fixed:

- **The document carries the first screen.** `#root` in `index.html` holds the landing page's
  navigation and hero, with the logo's 276×578 pixels declared, so the browser can paint the
  gallery before the bundle has run. React replaces the markup when it mounts, and
  `src/FirstScreen.test.tsx` holds the copy to the Belgian Dutch the page falls back to, so the
  swap cannot change the text under the visitor.
- **The account check no longer gates the paint.** `ProtectedLayout` used to draw a "checking
  session" screen until Keycloak answered, which put the whole page behind a round trip to the
  identity provider. It draws the shell immediately now; the routes that need an account wait for
  the answer themselves, and the account menu fills an empty slot when it arrives.
- **Nothing asks the identity provider for the session while the page loads.** `keycloak-js` used to
  be given `onLoad: "check-sso"` and a `silentCheckSsoRedirectUri`, so a returning visitor looked
  signed in without a round trip. That check cannot work in a browser that blocks third-party
  cookies, and before it even tries, the adapter loads Keycloak's third-party-cookie probe
  (`.../3p-cookies/step1.html`) in a hidden iframe of its own. That frame is cross-origin, Keycloak
  serves it with no `Cross-Origin-Resource-Policy` - not a header this site can add - and the browser
  refused it under the site's own `Cross-Origin-Embedder-Policy`: `init` rejected on its ten-second
  timeout and the sign-in button did nothing at all. The visitor is now simply signed out until they
  sign in, which is one navigation; a visitor who still has a Keycloak session does not see the form.
- **The gallery type is self-hosted.** `public/fonts` holds the latin subsets and
  `src/styles/_fonts.scss` declares them; `index.html` preloads the two faces of the first screen
  (Cormorant Garamond 400 for the heading, DM Sans 400 for the body copy). The type used to come
  from `fonts.googleapis.com` and `fonts.gstatic.com`, which cost two extra origins and arrived late
  enough to swap the text after it had already been painted.

Still open, in order of size: the compiled stylesheet is one ~314 KB file of which Lighthouse finds
roughly 289 KiB unused, because `_navigation.scss` imports all of Bootstrap and the chrome of every
screen ships with the landing page. Splitting it per route is the next big lever, but the cascade
order in `App.scss` is load-bearing, so it needs care. `keycloak-js` also sits in the eager vendor
chunk (about 30 KB gzipped); a dynamic import would take it off the critical path.

## Google Maps

The location page frames the gallery's address on Google Maps, and the administrator's address
lookup turns a typed address into coordinates through Google's geocoder. Both read one browser key,
`VITE_GOOGLE_MAPS_API_KEY`, and `src/services/googleMaps.ts` is the only place that does:

- **Maps Embed API** for the frame (`https://www.google.com/maps/embed/v1/place`). It is an iframe
  rather than the Maps JavaScript API on purpose: the landing page just spent its critical path on a
  first paint, and a frame costs the page no JavaScript of its own. It loads lazily, because it sits
  below the address on a phone.
- **Geocoding API** for the lookup behind *Find coordinates* on the admin's location screen.

The key ships in the bundle, so it is not a secret: restrict it in the Google Cloud console by
**HTTP referrer** to the gallery's origins (`https://galeriederuiter.cloud-ip.cc/*`, and
`http://localhost:3000/*` while developing) and enable only those two APIs on it.

Without a key the gallery still works. The location page shows the address, the opening hours and an
*Open in Google Maps* link — the Maps URL scheme needs no key, which is why that link is never
conditional — and the panel that would hold the frame drops its height for a quieter card: the mark
and the link, centred, instead of an empty rectangle where a map should be (`.map-frame-link-only` in
`src/styles/_location-02-location-facts.scss`, which `LocationMap.test.tsx` pins). The admin's lookup
says the lookup is unavailable rather than failing silently.
`src/services/googleMaps.test.ts` covers both builds. The OpenStreetMap embed and its Nominatim
lookup that this replaced are gone from the code and from the policy, and
`src/securityHeaders.test.ts` fails if either name comes back.

## Security headers

`nginx.conf` sends these on every response (the container deployment; see below for the static
one):

| Header | Value |
|---|---|
| `Content-Security-Policy` | `default-src 'self'; script-src 'self'; style-src 'self'; style-src-attr 'unsafe-inline'; font-src 'self'; img-src 'self' data: blob: <API>; connect-src 'self' <API> <Keycloak> https://maps.googleapis.com; frame-src 'self' https://www.google.com <Keycloak>; worker-src 'self' blob:; manifest-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'; upgrade-insecure-requests` |
| `Content-Security-Policy-Report-Only` | `require-trusted-types-for 'script'; trusted-types default` |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` |
| `X-Frame-Options` | `SAMEORIGIN` |
| `Cross-Origin-Opener-Policy` | `same-origin` |
| `Cross-Origin-Resource-Policy` | `same-origin` |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()` |
| `X-Permitted-Cross-Domain-Policies` | `none` |
| `X-XSS-Protection` | `0` |
| `X-DNS-Prefetch-Control` | `off` |
| `Origin-Agent-Cluster` | `?1` |
| `Clear-Site-Data` (path `/logout`) | `"cache", "cookies", "storage"` |
| `Access-Control-Allow-Origin` (path `/.well-known/*`) | `*`, with `Cross-Origin-Resource-Policy: cross-origin` beside it |

`script-src 'self'` — no `'unsafe-inline'`, no `'unsafe-eval'` — is what makes the policy worth
having: the app ships no inline script and no `eval`. The one script that used to live outside the
bundle, `public/silent-check-sso.js` for the silent sign-in check, went with the check itself (see
*Speed*), so the policy no longer allows a `<script src>` the bundle did not put there. `frame-src`
lists `'self'` beside the map and Keycloak - the gallery frames nothing of its own today, and a
same-origin frame is the one thing that value cannot break. `style-src`/`font-src` no longer list the
Google Fonts origins, because the gallery
type is served from this origin now (see *Speed*). The one inline handler the page used to have
(the `onload` that flipped the font stylesheet from `media="print"`) went with the Google Fonts
stylesheet it was flipping.

`style-src-attr 'unsafe-inline'` is what keeps the gallery itself working: the dashboard charts size
their bars, the theme picker draws its swatches and the photo carousel positions its slides with
style *attributes*, which `style-src 'self'` alone blocks. Allowing inline attributes is not the
same as allowing inline code — no script can run from a `style` attribute — and it is scoped to
attributes, so an injected `<style>` element is still refused. The built document is checked to be
free of inline `<style>` blocks, inline event handlers, `javascript:` URLs and `eval`; the one
`new Function` in the bundle is webpack's own `globalThis` fallback, which every browser of the last
few years short-circuits and which is wrapped in a `try`/`catch` for the ones that do not.

`frame-ancestors 'self'` and `X-Frame-Options: SAMEORIGIN` are the other way round from what a
hardening checklist suggests, and the reason is history: the gallery framed one of its own pages for
the silent sign-in check, so `'none'` and `DENY` blocked that check and a returning signed-in visitor
looked signed out. That check is gone (see *Speed*), which makes `'none'` and `DENY` safe today;
`src/securityHeaders.test.ts` records the decision either way. Both values close the clickjacking
risk, which is a foreign page framing the gallery.

`Cross-Origin-Embedder-Policy` is deliberately **absent**, and that is the one header here that was
removed rather than added. COEP makes every cross-origin frame, image and script on the page declare
a `Cross-Origin-Resource-Policy`, and the resources this page loads are other people's: the Google
map and Keycloak's own pages. Keycloak sends no CORP and cannot be given one - it is not this site's
server - so the header only takes things away, and it took away sign-in: keycloak-js loads Keycloak's
third-party-cookie probe in a hidden iframe, the browser refused that frame under COEP, the adapter
rejected on its ten-second timeout, and the sign-in button did nothing. `credentialless`, the
alternative the guidance offers, refuses that frame too. The only thing COEP buys is
`crossOriginIsolated`, which nothing here needs, so the site sends none and keeps
`Cross-Origin-Resource-Policy: same-origin` for its own responses instead.

`Clear-Site-Data` is on one path, not on the site: `/logout`. Signing out ends the Keycloak session,
and `AuthContext.logout` sends the browser back through `/logout`, so that one response tells the
browser to drop everything it holds for the gallery's origin — `"cache"`, `"cookies"` and
`"storage"`, which is the chosen language, the remembered city, the cached responses and the chat
session. Sent on every response it would clear the visitor's language on any page load, which is why
the header belongs on a logout response and not in the site-wide set.

That redirect is a Keycloak *post-logout* redirect, so the client has to allow it: the gallery's
domain is listed in the frontend client's `post.logout.redirect.uris` **attribute** in
`keycloak/realms/galerie-production-realm.json`, with `##` between URIs. That attribute is where
Keycloak keeps them - the field is not part of the client representation, and one there stops the
container with *"Unrecognized field"* (see *Keycloak realm files* in the repository README). A
Keycloak whose client lists no post-logout URIs falls back to the redirect URIs. If signing out ever
answers with *"Invalid redirect uri"*, that is the setting to look at.

**The API and Keycloak origins come from the environment**, so the policy always matches the
bundle: the image sets `CSP_API_ORIGIN` and `CSP_KEYCLOAK_ORIGIN` from the same build arguments
the frontend was built with, and `docker-compose.production.yml` passes them explicitly. Override
them if the browser-facing origins differ from the ones the frontend was built against.

**The photographs and the 3D models come from the API**, so the API is the service that has to allow
this origin to embed them: it sends `Cross-Origin-Resource-Policy: cross-origin`, because
`same-origin` and `same-site` are compared against the embedding page - this one - and this page is a
different host *and* a different site from the API. That header is what a page setting
`Cross-Origin-Embedder-Policy: require-corp` consults before it renders a cross-origin resource: this
site sends no COEP, so its own pages load those images either way, and the API's header is what keeps
them working for an embedder that does set it. See *API response headers* in the repository README.

### The static deployment (Render)

`render.yaml` publishes the frontend as a Render **static site**, which does not run nginx, so the
same headers are listed in the frontend service's `headers` block. Render sends header values as
written — there is no environment substitution — so that copy spells the origins out:
`https://galerie-java-api.onrender.com` and `https://galerie-keycloak.onrender.com`. It leaves
`X-Content-Type-Options` out because Render already sends `nosniff` itself. The report-only Trusted
Types policy is sent by both deployments: the audit that looks for the directive reads the static
site, and a rollout that is staged in one place and absent in the other is not staged, it is half
done. `src/securityHeaders.test.ts` fails when the two lists disagree, so a header added to one has
to be added to the other, and it checks the policy against the origins and style attributes the code
actually uses — including the `/.well-known/*` exception above, which is the only response that may
be read from another origin.

**A Blueprint change only reaches the site when the Blueprint is synced** in the Render dashboard
(*Blueprint* → *Sync*); `autoDeploy` deploys code, not Blueprint changes. The same values can be
entered by hand under *Headers* for the service, which takes effect on the next request.

To confirm the policy against the running site, open it and watch the console for `Refused to load`
/ `Refused to apply` messages while clicking through the landing page, the pop-up map, the chat, a
piece's page (the 3D viewer loads its model over `connect-src`) and the dashboard charts. Render
adds HSTS on its own `onrender.com` domains; on the custom domain the header above is what carries
it.

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

`max-age=31536000; includeSubDomains` is what the audit asks for, and both parts are safe here: the
gallery's host is `galeriederuiter.cloud-ip.cc`, so `includeSubDomains` covers subdomains of a name
the gallery would create itself, and there are none. If that ever changes — a subdomain that has to
answer over plain HTTP, for example — lower the `max-age` first, then remove `includeSubDomains`.

`preload` is deliberately **not** sent, and the audit's suggestion to add it does not apply to this
site. Preloading means submitting the domain to the browsers' built-in HSTS list, which can only be
done for a registrable domain the publisher owns; `galeriederuiter.cloud-ip.cc` is a subdomain of
`cloud-ip.cc`, so it cannot be submitted, and a `preload` token would claim a commitment nobody can
honour. If the gallery moves to a domain it owns, add `preload` **after** submitting it at
[hstspreload.org](https://hstspreload.org/) and confirming the whole domain — apex and every
subdomain — serves HTTPS.

## Learn More


You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).
