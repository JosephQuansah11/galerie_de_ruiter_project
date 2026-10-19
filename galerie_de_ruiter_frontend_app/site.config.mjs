/**
 * The site's public origin, in one place.
 *
 * Two build steps need it: `webpack.config.js` writes the absolute `og:url`/`og:image` of the
 * preview tags, and `scripts/generate-sitemap.mjs` writes `sitemap.xml` plus the absolute
 * `Agentmap:` and `Sitemap:` lines in `robots.txt`. Both run before the site exists anywhere, so
 * the origin cannot be taken from
 * the request; it has to be known at build time.
 *
 * `SITE_URL` (or `VITE_SITE_URL`) overrides it, for a staging deploy or a local build. The
 * default is production on purpose: a deploy that forgets the variable must not publish a
 * sitemap whose every URL points at `http://localhost:3000`. That is the sitemap Search Console
 * answers with "Couldn't fetch", and it takes the site out of the search results.
 *
 * The gallery owns this domain now. The older `https://galeriederuiter.cloud-ip.cc` still serves
 * the same build, and every page it serves declares this origin canonical, so a search engine
 * consolidates the two copies here rather than choosing between them. Remove the old host from
 * Render and Cloudflare only once the new one has settled in Search Console.
 */
export const PRODUCTION_ORIGIN = "https://galeriederuiterantieks.gripe";

/** The origin to build absolute URLs with, without a trailing slash. */
export function resolveSiteUrl(env = process.env) {
  const override = env.SITE_URL?.trim() || env.VITE_SITE_URL?.trim();
  return (override || PRODUCTION_ORIGIN).replace(/\/+$/, "");
}
