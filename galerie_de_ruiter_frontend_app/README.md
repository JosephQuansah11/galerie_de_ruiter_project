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
  the description is the one the landing page sets at runtime (`metaHomeDescription`). The head also
  carries the two tags that prove the domain to the search engines - `google-site-verification` for
  Search Console and `msvalidate.01` for Bing Webmaster Tools: the test pins both values, because a
  rebuild that dropped one would be reported as a lost property rather than as a missing tag.
- **`src/hooks/usePageMeta.ts`** — every page sets its own `<title>`, `<meta name="description">`,
  `<link rel="canonical">` and Open Graph tags. Pages call it with their own translated copy;
  the strings live in `pageMetaLabels` in `src/i18n.ts`. The canonical URL is built from the
  configured origin rather than from the host that served the page, so the copy Render also serves
  on its `onrender.com` domain never declares itself canonical. `index.html` deliberately carries
  none: it is the document every route is served, so a canonical written into it names one URL for
  all of them, and the pages it named were reported as *canonical to a different URL* — which asks
  a search engine to drop them from the index. `src/staticDocument.test.ts` checks both ends: the
  document has none, and every page declares one that the router actually serves.
- **`public/robots.txt`** — everything that answers with the sign-in page (`/admin`, `/cart`,
  `/wishlist`, `/profile`, `/preferences`) is closed to crawlers. A piece's own page is open now,
  because it is the gallery's content; the actions on it still need an account. `/login` and
  `/register` stay crawlable on purpose: they carry a `noindex` tag and a crawler that may not
  fetch them never sees it.
- **`scripts/generate-sitemap.mjs`** — runs after webpack (`npm run build`) and writes
  `dist/sitemap_index.xml` (and the same document at `dist/sitemap.xml`, the address earlier
  submissions used, so it keeps answering) plus the absolute `Sitemap:` line in
  `dist/robots.txt`.
  It lists the pages
  a visitor reaches without an account: `/`, `/antiques`, `/about`, `/map` and `/chat`, and it adds
  an `<image:image>` entry for every photograph of every piece the API returns (the 1600-pixel
  copy, not the original). Google deprecated `image:title` and `image:caption`; the page's `<img
  alt>` and the copy around it are what give the image its context.
- **Images** — Google Images can only index an image whose URL is crawlable, whose page is
  indexable, and which has useful alt text. The catalogue rows use the piece title as alt, a piece
  page sets `og:image` to its first 1600-pixel photograph, and every indexable page sends
  `max-image-preview:large`. The sitemap is the discovery path that does not depend on Google
  rendering the client-side page.
  The photographs are served from `galerie-java-api.onrender.com`. Google's image-sitemap rules
  require **both** the page domain and the image domain to be verified in Search Console when they
  differ, so add that API host as a URL-prefix property - its root serves the verification meta
  tag - or serve photographs from a host under `galeriederuiterantieks.gripe`. Submit
  `sitemap_index.xml` under *Sitemaps* after a deploy;
  image indexing takes days to weeks, not minutes. `Product`/`VisualArtwork` structured data and
  prerendering the piece pages are the next steps for product-style rich results, not
  prerequisites for basic image indexing.
- **the routes, on both deployments** — `render.yaml` names the application's routes one by one and
  `nginx.conf` names them in one regular expression, so a path the router does not draw is a 404
  rather than the landing page with a 200. `public/404.html` (with `public/404.css`) is the page a
  visitor gets, and `src/spaRoutes.test.ts` reads the router and both files, so a route that no rule
  covers fails a test instead of 404ing for a visitor who follows a deep link. The addresses that
  are *not* pages are permanent redirects on both: `/home` is the landing page under its old name
  and `/dashboard` its predecessor, and each sends the visitor to the URL that is canonical, so two
  addresses never compete for one page in the index.

**What a visitor may do.** The landing page, the gallery story, the pop-up's address, the concierge
chat, the first page of the collection and a piece's own page are readable without an account, and
they are the pages a crawler may index. Everything past that needs one: the pages after the first of
the collection, the basket, the wishlist, the profile and the admin. On a piece's page the story,
photographs and price are public; saving it, liking it or putting it in the basket is what sends the
visitor to sign in. The collection is gated where an action happens rather than at the page:
`src/pages/antiques/CataloguePage.tsx` gives a visitor the first page and an invitation to sign in
where the paging controls would be, `src/pages/antiques/AntiqueRow.tsx` and
`src/pages/antiques/DetailSummary.tsx` send the save, basket and like buttons to the sign-in page
with the page they are on as the one to come back to, and the admin, basket, wishlist, profile and
preferences screens sit behind `RequireAccount` in `src/ProtectedRoutes.tsx`. The navigation follows
the same line: `src/components/NavigationLinks.tsx` shows a visitor the four public destinations and
hides the rest rather than offering a link that only bounces them.

The site's public origin lives in `site.config.mjs`, in one place, because three build steps need
it: the sitemap (and the `Sitemap:` line in `robots.txt`), the absolute `og:url`/`og:image` of the
social preview tags, and the canonical URL every page declares — webpack hands that one to the
bundle as `import.meta.env.SITE_URL`. The static document declares the same origin, so a crawler
that runs nothing still reads it. It defaults to `https://galeriederuiterantieks.gripe`, the domain
the gallery owns, so a deploy that sets nothing still publishes the right URLs; `SITE_URL` overrides
it for a staging deploy or a local build:

```bash
SITE_URL=http://localhost:3000 npm run build
# or, for the container:
docker build --build-arg SITE_URL=https://www.example.be ./galerie_de_ruiter_frontend_app
```

`render.yaml` sets `SITE_URL` for the static site. Like the other frontend values in it, it is
read while the bundle is built, so changing it needs a new deploy. Both the new domain and the older
`galeriederuiter.cloud-ip.cc` serve that one build; the canonical URLs inside it are what tell a search
engine which host is the gallery.

The `og:image` a shared link shows is `logo512.png`. A 1200×630 image in `public/` pointed at
from `index.html` makes for a richer preview, which is what a shared link gets instead of a
square logo.

### Google Search Console

A sitemap is only as good as the origin inside it. URLs a crawler cannot fetch - `localhost`
among them - come back as *Couldn't fetch*, and the pages stay out of the results even though
the site itself is reachable. Check what a deploy actually published before submitting anything:

```bash
curl -s https://galeriederuiterantieks.gripe/sitemap_index.xml | grep '<loc>'
curl -s https://galeriederuiterantieks.gripe/robots.txt
```

Both should name the public origin. Then, in Search Console, submit
`https://galeriederuiterantieks.gripe/sitemap_index.xml` under *Sitemaps*, and use *URL inspection* →
*Request indexing* for `/`, `/about` and `/map`.

The new property is verified by its `google-site-verification` TXT record in the Cloudflare zone, so
nothing in a deploy has to carry a token for it. The older property is verified by the tag in
`index.html`, which `src/staticDocument.test.ts` pins, and that token is harmless on the new host.
Both hosts serve pages that name the same canonical origin. Bing Webmaster Tools verifies a domain
the same way; the `msvalidate.01` tag beside the Google one is pinned by the same test.

Every page the gallery wants indexed is now readable without an account: the landing page, the
collection list and each piece, the story, the map and the chat. A crawler that follows a catalogue
card or a related piece follows a real `<a href>`; the sitemap script reads `GET /api/antiques` at
build time and adds each piece, so a piece is discoverable even before a crawler follows a card.
Saving, buying and liking still send the visitor to sign in, and the admin, basket, wishlist,
profile and preferences pages stay behind the account and in `robots.txt`'s Disallow list.

**The remaining limit is that this is a client-rendered single page.** The server sends the landing
document for `/antiques`, `/about`, `/map` and `/chat`; the bundle replaces the title, description,
canonical and content after it runs. Google renders JavaScript, so those pages can be indexed, but a
prerender of the public routes would make the first HTML route-specific and remove the dependence on
rendering. That is the next step if ranking on those pages matters.

**The gallery owns its domain now.** `https://galeriederuiterantieks.gripe` is the canonical origin:
`PRODUCTION_ORIGIN` in `site.config.mjs` names it, `SITE_URL` in `render.yaml` names it, and every
page declares it canonical - including the pages served on the older free subdomain. The old
`https://galeriederuiter.cloud-ip.cc` is deliberately still attached and still serves this build, so
existing links and bookmarks keep working while Google moves its index. It is not a second canonical
site: every response names the new domain, and the sitemap lists only new-domain URLs. Retire the old
host only once Search Console shows the new property indexed, and make the retirement a redirect
rather than a deletion, so the links keep working.

The move touches these systems, in this order:

1. `site.config.mjs` (`PRODUCTION_ORIGIN`) and `SITE_URL` in `render.yaml`, then rebuild: the
   canonical URLs, sitemap, `robots.txt`, Open Graph tags and structured data are built from it.
   `llms.txt` and the two `/.well-known` manifests are static files, so their URLs were changed by
   hand in the same commit.
2. Render → `galerie-frontend` → Custom Domains: add the apex and `www`, with `www` redirecting to
   the apex. The new host already answers with this build, so this is in place.
3. Cloudflare: keep the proxied DNS records that point the new host at Render, and leave the old
   host's record in place for as long as it is served.
4. Google Search Console: the new property is verified by its `google-site-verification` TXT record;
   the meta tag in `index.html` verifies the old property and stays. Submit
   `https://galeriederuiterantieks.gripe/sitemap_index.xml` under *Sitemaps*, and request indexing for
   `/`, `/about` and `/map`. Keep the old property while the old host is served - it is how those
   links stay monitored - but there is one sitemap now and it lists only new-domain URLs, so the new
   property is the one whose coverage matters. Add the new site to Bing Webmaster Tools too; IndexNow
   announces whichever origin the build was made for.
5. Supabase Auth → URL Configuration: Site URL and additional redirect URLs for both gallery
   origins while the old host is served. Keycloak is no longer deployed in production.
6. `FRONTEND_ORIGIN` on `galerie-java-api`: a comma-separated list with both origins. Also check the
   `VITE_*` values and `SITEMAP_API_URL` in `render.yaml`.
7. `PRODUCTION_HOSTS` in `src/services/clarity.ts` holds both hosts, and the Google Maps key's HTTP
   referrer restrictions list both origins.
8. The CSP in `security-headers.conf` and `render.yaml` names origins explicitly. The frontend's own
   origin is `'self'`, so the move does not change it; check `connect-src` for the API and
   `frame-src` for the Google map.

### IndexNow

Bing, Yandex, Seznam and Naver share one submission, so a URL announced to `api.indexnow.org`
reaches all of them. A static site has nowhere to announce from but its build, which is what
`scripts/generate-sitemap.mjs` does: once the sitemap is written it posts the same URL set.

```json
{ "host": "galeriederuiterantieks.gripe", "key": "…", "keyLocation": "…", "urlList": ["…"] }
```

The key was generated in Bing Webmaster Tools, and the file that proves the domain owns it is
`public/413098dae5154255acb93dd6e4e9ad9c.txt` - at the site root, named after the key, containing the
key and nothing else. The same build serves it from both hosts while the old one is still live, so a
submission for either origin can read it back. `src/indexNow.test.ts` reads both, so rotating the key
in one place cannot leave the other behind: the submissions would answer 403 while every other check
stayed green.

It submits only from a build for the production origin, never from localhost, because a staging build
names URLs a crawler cannot fetch and announcing those is worse than saying nothing. `INDEXNOW=off`
silences a production build as well, which is what the CI workflow does - it builds the site on every
push, and each of those builds would otherwise announce content nobody has deployed. A submission is
a courtesy rather than a step: every answer is logged (200 accepted, 202 accepted while the key is
still being checked, 403 key mismatch, 429 too many) and none of them can fail the build.

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

It is advertised two ways: the `<link>` tags in `index.html`, and the conventional well-known path
itself. The document carries two relations because the specification renamed one: `rel="ai-catalog"`
is the AI Catalog relation, and `rel="ard"` is the one Agentic Resource Discovery v0.91 names in its
place. An `Agentmap:` line in `robots.txt` was a third way and the gallery dropped it, so the build
writes the sitemap line only - and removes an `Agentmap:` line an earlier build left behind
(`scripts/generate-sitemap.mjs`), because a stale line outlives the decision that removed it.
`/.well-known/*` is also the one place the site sends `Access-Control-Allow-Origin: *` and
`Cross-Origin-Resource-Policy: cross-origin` (see *Security headers*), because a crawler reading the
manifest from its own origin makes a cross-origin request.

**Why the manifest was reported as malformed.** This is a single-page application: the server hands
the shell to the paths the application draws and answers anything else with a 404 (see *Search
engines*), and before those files existed the manifest path was one of the paths answered with the
shell — `200` and the HTML document — so a crawler that asked for `ai-catalog.json` got
`<!DOCTYPE html>` where JSON was expected: *"Malformed JSON in manifest: SyntaxError: Unexpected
token '<'"*. Render and nginx both serve a real file before any rule is considered, so shipping the
file is the whole fix; `src/agentDiscovery.test.ts` fails if the file, its fields, the paths that
advertise it, or the webpack `globOptions.dot` that copies a dot directory go missing.

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

### Adding a theme

A theme is a palette, not a stylesheet. `src/context/themes.ts` holds the fourteen the preferences
screen offers, `src/context/themeStyles.ts` writes their ten colours onto the document as `--theme-*`
variables, and the rules read those variables rather than a colour of their own - so a new palette is
two entries in `themes` (the light form and the dark form of the same palette, each naming the other
in `counterpart`) and two in `themeTranslationKeys`, plus a label for each in the five languages
(`src/i18n.ts` for English and Belgian Dutch, `src/i18nExtra.ts` for the rest). `isDark: true` is the
whole of what makes a palette dark: it adds the `theme-dark` class the dark rules hang off, and
nothing else has to change. `src/context/themes.test.ts` fails when a palette is missing one of the
ten colours, when a light palette has no dark form, when the two do not name each other, or when a
label is missing from a language.


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
  timeout and the sign-in button did nothing at all. The page still asks nobody for a session, and it
  no longer needs to: the tokens are kept in `localStorage` (`src/services/keycloakSession.ts`) and
  handed to `init`, which refreshes them against the token endpoint before it answers, so a reload
  and a new tab are the same signed-in visitor. A visitor who has no stored tokens but still has a
  Keycloak session does not see the form either, because Keycloak answers with the session it has.
- **A refused token no longer empties the gallery.** The app sends its bearer token with every
  request, and the API answers 401 to a token it cannot decode or that has expired — on the public
  endpoints as well, because the resource server fails the request before authorization is consulted.
  One stale token therefore used to take the whole site down for someone who was signed in: no
  collection, no piece pages. The axios instance now checks the stored session's `expiresAt` before
  sending it, and drops the refused token and the session behind it (through
  `setUnauthorizedHandler`) before retrying that one request without it, so the pages a visitor may
  read keep loading and the visitor is simply signed out again. The retry is marked
  (`retriedWithoutToken`) so the backend client's request interceptor does not put the refused token
  back. `src/apis/authPromise.test.ts` pins the retry and the 401 that is reported as it is when the
  request carried no token; `src/apis/backendClient.test.ts` pins the expiry check and the marked
  retry.
- **The gallery type is self-hosted.** `public/fonts` holds the latin subsets and
  `src/styles/_fonts.scss` declares them; `index.html` preloads the two faces of the first screen
  (Cormorant Garamond 400 for the heading, DM Sans 400 for the body copy). The type used to come
  from `fonts.googleapis.com` and `fonts.gstatic.com`, which cost two extra origins and arrived late
  enough to swap the text after it had already been painted.
- **Pictures are sized for the slot and cached for a year.** Every card, related strip, basket,
  wishlist and admin inventory row asks for the 400-pixel `/thumbnail` copy (about 40 KB), and the
  catalogue card offers 400w/800w through `srcset`. A piece's own page offers 800w and 1600w
  copies and fetches the original only when a visitor asks for it. Antique, welcome-slider and About
  image responses send `Cache-Control: public, max-age=31536000, immutable`, so a returning visitor
  does not download them again. The main piece image and the first slider slide load eagerly with
  `fetchpriority="high"`; everything below the fold is lazy and decodes off the main thread.

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
**HTTP referrer** to the gallery's origins (`https://galeriederuiterantieks.gripe/*`,
`https://galeriederuiter.cloud-ip.cc/*` while the old host is still served, and
`http://localhost:3000/*` while developing) and enable only those two APIs on it.

Without a key the gallery still works. The frame falls back to Google's classic keyless embed, which
still shows the street and the pin, so the panel never stands there as an empty rectangle; the
address, the opening hours and the *Open in Google Maps* link (the Maps URL scheme needs no key) stay
in place. The key is still worth setting: the Embed API gives the gallery its own keyed frame, and
the admin's *Find coordinates* lookup needs the Geocoding API. Without it the lookup says it is
unavailable rather than failing silently. `src/services/googleMaps.test.ts` and
`LocationMap.test.tsx` cover both builds. The OpenStreetMap embed and its Nominatim lookup that this
replaced are gone from the code and from the policy, and `src/securityHeaders.test.ts` fails if
either name comes back.

## Accounts and profiles

Signing in is Keycloak's job; what the app knows about the visitor is the API's. The two meet at one
endpoint, `GET /api/me`, which the app asks on every page load so that the profile screen and the
account menu show what the gallery's own database holds rather than only what the token says.

- **`GET /api/me` needs a signed-in visitor, not a role.** It answers with the caller's own profile,
  looked up by the token's subject, and creates that row when it is missing - so being signed in is
  the whole requirement. It used to require `USER` or `ADMIN`, and the realm defines both roles but
  grants neither to a new account: every visitor who registered was refused their own profile with
  403 until someone granted them a role by hand, and because the app asks on every page load, each of
  them got a failed request in the browser console. A role belongs on what a role guards - the
  `ADMIN` writes - which is where the rest of `SecurityConfiguration` puts it.
  `UserControllerSecurityTest` pins both halves: a token carrying no role is answered, an anonymous
  request is not.
- **The app does not send a request it knows will be refused.** `src/context/useAuthInitialization.ts`
  reads the roles out of the token and asks `/api/me` only when it carries one the endpoint accepts
  (`PROFILE_ROLES`), so a realm that has granted nothing yet costs the visitor nothing. Their name,
  email and picture already came from the token, and the profile row is still created the first time
  they save something. `AuthContext.test.tsx` pins both cases.
- **"No avatar yet" is an answer, not an error.** `GET /api/me/avatar` answered 404 for a visitor who
  has not uploaded a picture, which the browser reports as a failed request in the console on every
  page load - the one line the gallery saw in a console that was otherwise clean. It answers 204 now,
  which says the same thing without the failure, and the frontend read both all along
  (`loadProfileAvatar`). `ProfileAvatarControllerTest` pins it, together with the picture it does
  send and the visitor whose row does not exist yet.

## Forms and their labels

An audit reported that a form field had no `id`. A control without one cannot be named by a
`<label for>` or reached through a fragment, and assistive technology falls back to the placeholder,
which is a hint rather than a name. Every control on a page a visitor reaches carries one now: the
chat composer (`chat-message`), the three fields of the appointment request (`chat-appointment-date`,
`-time`, `-type`), the collection search (`catalogue-search`) and the page size
(`catalogue-page-size`). The language switcher (`language-switcher`) has one too, for the day a screen
puts it back: it is labelled by `aria-label` rather than a `<label>`, and nothing renders it today, so
it is not in the bundle.

Still open: the admin screens keep their `Form.Group`/`Form.Label` pairs, and most of those groups
declare no `controlId`, so Bootstrap cannot wire the label to the control inside it. `LocationCoordinates`
and `HomeAdminPage` show the shape the rest should follow - `controlId` on the group, or an explicit
`id` on the control - and the audit does not reach those screens, because they need an account.

## Importing a folder of pieces

An admin can add a whole collection at once from **Antique inventory → Import folder** (also in the
admin navigation). The browser reads the chosen folder and all of its subfolders; nothing is
uploaded until the preview has been checked and **Import** is pressed. CSVs can sit inside the
folder or be chosen separately with **Choose CSV files** when the spreadsheet is kept elsewhere.

A folder the importer understands looks like this:

```text
Collection/                 <- the folder the admin picks
  pieces.csv                <- one or more CSVs, at any depth
  Mirrors/
    Carved mirror/
      front.jpg
      back.jpg
      details/close.jpg
  Lamps/
    Brass lamp/
      front.jpg
```

```csv
file,title,description,price
Mirrors/Carved mirror,Carved walnut mirror,Late 19th century,480.50
Lamps/Brass lamp/front.jpg,Brass reading lamp,Art deco,"1,250.00"
```

- **Columns** are matched by name, in English, Dutch, French or German. `file`, `filename`,
  `image`, `photo`, `bestand`, `afbeelding`, `datei`, `fichier` and `path` name a file or folder;
  `title`, `titel`, `titre`, `naam` and `name` are the title; `description`, `beschrijving`,
  `omschrijving`, `beschreibung` are the description; `price`, `prijs`, `preis` and `prix` are the
  price. A `name` column is read as filenames when every value looks like one, and as titles
  otherwise.
- **CSV files** inside the selected folder are read automatically. **Choose CSV files** opens a
  separate multi-file picker for a spreadsheet kept outside the folder; selecting again replaces
  that outside selection, while CSVs inside the folder stay in use. Both sets are matched and
  deduplicated.
- **Matching** tries the full image path, then the folder path, then an image name, then the
  folder name, then the title. Paths may be written from the item folder (`Mirrors/Carved mirror`),
  so the selected root's own name is not needed. If the same filename exists in two folders, use
  the folder path in the CSV; the importer will not guess.
- **Prices** may be `480`, `480.50`, `480,50`, `1.250,00` or `1,250.00`; a currency symbol is
  ignored. A row without a readable price is flagged and stays editable.
- **Grouping.** In folder mode (the default) all photographs in an item folder become one piece,
  and a `details/` subfolder stays with it. A folder that holds no photographs directly, such as a
  category folder, does not merge its children. Images loose in the selected root become pieces of
  their own. Switch to **One piece per image** when the CSV has one row per photograph.
- **Artist.** Artists are required by the API, so the importer cannot save a piece without one.
  Every row is selected by default; search for an artist and choose a result to assign that artist
  to the selection. Untick the rows that should keep another artist, then search and choose again.
  The search box filters the list, and **Select all** applies to the filtered rows. A new artist can
  be created in the same screen.
- **Category.** Every new piece needs a category before it can be imported. A `category` column
  in the CSV is matched by name - a main category, a child, or the full path (`Mirrors / Wall
  mirrors`, `Mirrors > Wall mirrors`) - and a name the gallery does not have is listed as an issue.
  Select rows and choose a category in the assignment card to give them one at once, or pick the
  category on the row itself; main categories and subcategories are in the same list.
- **Existing pieces.** The import matches a folder or CSV title against the inventory,
  case- and accent-insensitively. A match updates that piece instead of creating a duplicate:
  title, description, price, artist and category are updated where the import supplies them, blank
  fields keep what the piece already has, and its photographs are appended to the existing ones.
  The import waits for the inventory list and pauses with a warning if it cannot load it, so it
  cannot create duplicates while the check is unavailable. Two folders with the same title become
  one row and one update, with all their photographs; if their details disagree, the first is used
  and the issue list flags the title for review. Re-importing the same folder appends its
  photographs again - there is no content-hash check yet.
- **Before importing**, each row shows whether a CSV row matched, how many photographs it has and
  its folder. Title, description and price can be corrected inline.
- **Uploads** run one piece at a time and show progress. A failure leaves that row selected with its
  error; retrying continues from where it stopped and does not create the piece twice. Images are
  the same formats and 8 MB limit as the single-piece form.
- **Encoding.** CSV files may be UTF-8 (with or without BOM), Windows-1252 (what Excel often writes)
  or UTF-16, with comma, semicolon or tab delimiters. Quoted fields and newlines inside a
  description are supported.



`nginx.conf` sends these on every response (the container deployment; see below for the static
one):

| Header | Value |
|---|---|
| `Content-Security-Policy` | `default-src 'self'; script-src 'self' https://*.clarity.ms https://c.bing.com; style-src 'self'; style-src-attr 'unsafe-inline'; font-src 'self'; img-src 'self' data: blob: <API> https://*.clarity.ms https://c.bing.com; connect-src 'self' <API> https://maps.googleapis.com https://*.clarity.ms https://c.bing.com; frame-src 'self' https://www.google.com; worker-src 'self' blob: https://*.clarity.ms; manifest-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'; upgrade-insecure-requests` |
| `Content-Security-Policy-Report-Only` | `require-trusted-types-for 'script'; trusted-types default clarity` |
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
lists `'self'` beside the Google map - the gallery frames nothing of its own today, and a
same-origin frame is the one thing that value cannot break. `style-src`/`font-src` no longer list the
Google Fonts origins, because the gallery
type is served from this origin now (see *Speed*). The one inline handler the page used to have
(the `onload` that flipped the font stylesheet from `media="print"`) went with the Google Fonts
stylesheet it was flipping.

A console error about an inline script on this origin is not the application. Cloudflare's
JavaScript Detections injects a per-request `<script>` into HTML responses; the token changes on
every response, so no CSP hash can allow it. The HTML responses carry `Cache-Control: no-transform`
(see `render.yaml` and `nginx.conf`), which is Cloudflare's documented opt-out and keeps
`script-src` free of `'unsafe-inline'`. If JavaScript Detections is wanted, it needs a nonce-based
policy, which Cloudflare can propagate, not a hash.

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
map does not send that header and this site cannot add it to someone else's server. The only thing
COEP buys is `crossOriginIsolated`, which nothing here needs, so the site sends none and keeps
`Cross-Origin-Resource-Policy: same-origin` for its own responses instead.

`Clear-Site-Data` is on one path, not on the site: `/logout`. Signing out clears the browser's
Supabase session through `AuthContext.logout`; the `/logout` response still tells the browser to drop
everything it holds for the gallery's origin — `"cache"`, `"cookies"` and `"storage"`, which is the
chosen language, the remembered city, the cached responses, the chat session and the stored sign-in
session. Sent on every response it would clear the visitor's language on any page load, which is why
the header belongs on a logout response and not in the site-wide set.

Keeping a session across page loads means keeping a refresh token in the browser:
`src/context/useSupabaseSession.ts` writes it to `localStorage`, where it stays until the visitor
signs out or Supabase refuses to refresh it. `script-src 'self'` without `'unsafe-inline'` is what
makes that acceptable here — the app ships no inline script, so nothing else runs on this origin to
read it — and a refresh token that has been rotated or revoked is worth nothing to whoever did.

**The API origin comes from the environment**, so the policy always matches the bundle: the image
sets `CSP_API_ORIGIN` from the same build argument the frontend was built with, and
`docker-compose.production.yml` passes it explicitly. Override it if the browser-facing API origin
differs from the one the frontend was built against.

The `/logout` page and its `Clear-Site-Data` header remain available; production authentication uses
Supabase, which signs out with a request rather than an identity-provider redirect.

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

That is `script.src = …` for a lazily loaded route, which every navigation needs. `webpack.config.js`
now passes `output.trustedTypes: { policyName: "default" }`, so webpack creates that policy and sets
`src` through it. The Clarity loader (`src/services/clarity.ts`) also sets a script `src`, and it
creates a policy named `clarity` for it; the report-only header names both (`trusted-types default
clarity`). One policy name to keep in step between the webpack config and two header files would be
one too many, so each sink names its own policy and the header lists them.

What is left of the rollout is the last step: move `require-trusted-types-for 'script'; trusted-types
default clarity` into the enforced `Content-Security-Policy` in `security-headers.conf` and
`render.yaml`, after re-running the collector against the built site on the landing page **and** on a
lazy route (`/login`), plus a page that mounts the 3D viewer — and then delete the report-only
header. The collection is also worth running once with analytics accepted, because Clarity's own
script runs in the page after the loader has requested it.

## Analytics

Microsoft Clarity measures how the gallery is used. It is deliberately not loaded with the document:
Clarity records sessions and sets cookies, so `src/services/clarity.ts` starts it only after the
visitor accepts the banner (`src/components/AnalyticsConsent.tsx`). The answer is remembered in
`galerie-analytics-consent`, the same switch is offered under Preferences, and declining means the
vendor tag is never requested — not merely told to behave.

The loader is part of the bundle rather than a snippet pasted into `index.html`, which keeps
`script-src` free of `'unsafe-inline'`; the script itself comes from
`https://www.clarity.ms/tag/z0549z8r1v`. `PRODUCTION_HOSTS` in `src/services/clarity.ts` names the
gallery's own hosts - the new domain and the older free subdomain while it is still served - and the
loader refuses every other hostname, so previews, tests and localhosts never send data. Withdrawing
consent calls Clarity's `consent` command, which deletes its cookies and stops tracking until it is
granted again.

### Rolling out HSTS

`max-age=31536000; includeSubDomains` is what the audit asks for, and both parts are safe here: the
gallery's host is `galeriederuiterantieks.gripe`, which it owns, so `includeSubDomains` covers a name
the gallery controls and on which every subdomain answers over HTTPS. The older
`galeriederuiter.cloud-ip.cc` sends the same header, but HSTS applies to the host that sent it (and
its subdomains), so it neither widens nor weakens what the new domain claims. If a subdomain ever has
to answer over plain HTTP, lower the `max-age` first, then remove `includeSubDomains`.

`preload` is deliberately **not** sent. Now that the gallery owns a registrable domain it *can* be
submitted at [hstspreload.org](https://hstspreload.org/), but a `preload` token is a long-lived
commitment to the apex and every subdomain, and the browsers' list takes time to remove a site from.
Submit the domain first, confirm the apex and `www` both serve HTTPS, and only then add `preload` to
both the header and `render.yaml`. The year-long max-age is the part that protects a visitor today.

## Learn More


You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).
