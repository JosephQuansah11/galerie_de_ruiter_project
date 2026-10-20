/**
 * Writes the two files a search engine looks for into the built site: `sitemap.xml` and the
 * `Sitemap:` line inside `robots.txt`.
 *
 * The site origin comes from `site.config.mjs`, the same module `webpack.config.js` reads for the
 * social preview tags. Its default is the production origin, and SITE_URL overrides it, so the
 * same source still produces a sitemap for a local run, for staging and for production. It runs
 * after webpack, see the `build` script in package.json.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PRODUCTION_ORIGIN, resolveSiteUrl } from "../site.config.mjs";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
// The output directory. `src/indexNow.test.ts` overrides it so that running the script there cannot
// overwrite the files a build wrote into dist/.
const distDir = process.env.SITEMAP_DIST_DIR ? path.resolve(process.env.SITEMAP_DIST_DIR) : path.join(appRoot, "dist");

/**
 * The pages a visitor reaches without an account. Everything else answers with the sign-in
 * page and is disallowed in robots.txt, so it does not belong in a sitemap. The landing page is
 * the root: `/home` and the older `/dashboard` are sent to it by both servers, so a sitemap
 * listing them would list a redirect.
 */
const publicPages = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/antiques", changefreq: "weekly", priority: "0.9" },
  { path: "/about", changefreq: "monthly", priority: "0.8" },
  { path: "/map", changefreq: "monthly", priority: "0.8" },
  { path: "/chat", changefreq: "monthly", priority: "0.6" },
];

/**
 * The API that lists the pieces, when the build can reach it.
 *
 * This is deliberately its own variable rather than one of the `VITE_*` values: a local or test
 * build must not wait on an API that is not running, and the test env sets `VITE_JAVA_API_URL` to a
 * name that does not resolve. `render.yaml` sets this one for the static deploy.
 */
const apiOrigin = (process.env.SITEMAP_API_URL ?? "").trim().replace(/\/+$/, "");

/**
 * A photograph's URL, made absolute against the API origin. The API returns paths such as
 * `/api/antiques/{id}/image/{imageId}`; an image sitemap needs full URLs.
 */
function absoluteImageUrl(url) {
  if (typeof url !== "string" || !url.trim()) return undefined;
  try {
    return new URL(url, apiOrigin).toString();
  } catch {
    return undefined;
  }
}

/**
 * The 1600-pixel copy a piece's own page offers. It is what Google should fetch: large enough to
 * rank in Images, small enough that a build does not ask a crawler to download a six-megabyte
 * original. A path without an image id has no variant route, so it is used as it is.
 */
function imageSitemapUrl(url) {
  const absolute = absoluteImageUrl(url);
  if (!absolute) return undefined;
  return /\/image\/[^/?#]+$/.test(absolute) ? `${absolute}/large` : absolute;
}

/** The image entries for one piece: one per photograph, in the gallery's order. */
function imageEntries(item) {
  const urls = Array.isArray(item.imageUrls) ? item.imageUrls : [];
  const candidates = [...urls, item.imageUrl].filter((url) => typeof url === "string" && url.trim());
  const seen = new Set();
  return candidates.flatMap((url) => {
    const loc = imageSitemapUrl(url);
    if (!loc || seen.has(loc)) return [];
    seen.add(loc);
    return [loc];
  });
}

/**
 * A piece's own page is public and is the gallery's content, so it belongs in the sitemap. The
 * list comes from the API at build time; without an API the five static pages are still written
 * rather than failing the build.
 */
async function piecePages() {
  if (!apiOrigin) return [];
  try {
    const response = await fetch(`${apiOrigin}/api/antiques`, { signal: AbortSignal.timeout(10_000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const items = await response.json();
    if (!Array.isArray(items)) throw new Error("the answer was not a list");
    return items
      .filter((item) => item && typeof item.id === "string" && item.id)
      .map((item) => ({
        path: `/antiques/${item.id}`,
        changefreq: "weekly",
        priority: "0.7",
        images: imageEntries(item),
      }));
  } catch (error) {
    console.warn(`generate-sitemap: piece pages were not added (${error.message})`);
    return [];
  }
}

/** Static pages first, then the pieces; a path can only appear once. */
const pages = [...new Map([...publicPages, ...await piecePages()].map((page) => [page.path, page])).values()];

function escapeXml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

const siteUrl = resolveSiteUrl();

if (!/^https?:\/\//i.test(siteUrl)) {
  console.error(`generate-sitemap: SITE_URL must be an absolute URL, got "${siteUrl}"`);
  process.exit(1);
}

if (/^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])/i.test(siteUrl)) {
  console.warn(
    `generate-sitemap: SITE_URL points at localhost, so the sitemap would too, and a search\n` +
    `                  engine cannot fetch those URLs. Unset SITE_URL to build for\n` +
    `                  ${PRODUCTION_ORIGIN} instead.`,
  );
}

const lastmod = new Date().toISOString().slice(0, 10);
const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
  '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">',
  ...pages.map((page) => [
    "  <url>",
    `    <loc>${escapeXml(`${siteUrl}${page.path}`)}</loc>`,
    `    <lastmod>${lastmod}</lastmod>`,
    `    <changefreq>${page.changefreq}</changefreq>`,
    `    <priority>${page.priority}</priority>`,
    // Google deprecated image:title and image:caption; the page's <img alt> and its surrounding
    // copy carry that context now. The location is the required part of an image entry.
    ...(page.images ?? []).flatMap((loc) => [
      "    <image:image>",
      `      <image:loc>${escapeXml(loc)}</image:loc>`,
      "    </image:image>",
    ]),
    "  </url>",
  ].join("\n")),
  "</urlset>",
  "",
].join("\n");

mkdirSync(distDir, { recursive: true });
// Both names serve the same document. The gallery submits `sitemap_index.xml`, and the address
// earlier submissions used (`sitemap.xml`) keeps answering instead of turning into a 404.
for (const name of ["sitemap_index.xml", "sitemap.xml"]) {
  writeFileSync(path.join(distDir, name), sitemap, "utf8");
}

// A crawler only finds either of these through an absolute URL, so the lines are added here rather
// than kept in public/robots.txt, which has to stay origin-independent. A line already in the file
// is stale - this build knows the origin it was made for - so it is replaced, not kept.
//
// The `Agentmap:` line an earlier build wrote here is removed and not written again: the gallery does
// not advertise the Agent Discovery manifest from robots.txt. Nothing is lost by that - the manifest
// is still served at /.well-known/ard.json, and the document names it with <link rel="ard">, the
// relation a conforming consumer must honour. A line left behind by an older build would outlive the
// decision, which is why the filter above names it.
const robotsTarget = path.join(distDir, "robots.txt");
const robotsSource = existsSync(robotsTarget) ? robotsTarget : path.join(appRoot, "public", "robots.txt");
if (existsSync(robotsSource)) {
  const robots = readFileSync(robotsSource, "utf8")
    .split(/\r?\n/)
    .filter((line) => !/^(Sitemap|Agentmap):/i.test(line))
    .join("\n")
    .trimEnd();
  writeFileSync(
    robotsTarget,
    `${robots}\n\nSitemap: ${siteUrl}/sitemap_index.xml\n`,
    "utf8",
  );
} else {
  console.warn("generate-sitemap: no robots.txt to add the Sitemap line to");
}

console.log(`generate-sitemap: ${pages.length} URLs for ${siteUrl} (sitemap_index.xml)`);

/**
 * IndexNow: the URL set above, announced to the search engines that take part in it. One POST to
 * api.indexnow.org reaches all of them, because they agreed to share submissions.
 *
 * The key is the one the gallery generated in Bing Webmaster Tools, and the file that proves the
 * domain owns it is `public/<key>.txt` - served from the site root, so an engine can read the key
 * back and accept a submission. `src/indexNow.test.ts` holds the two together, so rotating the key
 * in one place cannot leave the other behind.
 *
 * Only a build for the production origin submits. A local or staging build names URLs a crawler
 * cannot fetch, and announcing those is worse than saying nothing - so localhost and any SITE_URL
 * that is not the gallery's own origin are skipped. INDEXNOW=off silences a production build too,
 * which is what CI does: the workflow builds the site on every push, and each of those builds would
 * otherwise announce content that no one has deployed.
 *
 * A submission is a courtesy, not a build step. Every outcome is logged and none of them touches the
 * exit code: the sitemap is already written, and the engines crawl on their own schedule whatever
 * happens here. The answers are 200 (accepted), 202 (accepted, the key is still being checked), 403
 * (the key file did not answer with the key) and 429 (too many submissions).
 */
const INDEXNOW_KEY = "413098dae5154255acb93dd6e4e9ad9c";

async function submitToIndexNow(urls) {
  const endpoint = "https://api.indexnow.org/indexnow";
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host: new URL(siteUrl).host,
        key: INDEXNOW_KEY,
        keyLocation: `${siteUrl}/${INDEXNOW_KEY}.txt`,
        urlList: urls,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    console.log(`generate-sitemap: IndexNow answered ${response.status} for ${urls.length} URLs`);
  } catch (error) {
    console.warn(
      `generate-sitemap: the IndexNow submission did not go through (${error.message});\n` +
      `                  the sitemap is written either way, and a crawler finds the pages on its schedule.`,
    );
  }
}

const productionOrigin = PRODUCTION_ORIGIN.replace(/\/$/, "");
const isProductionBuild = siteUrl.replace(/\/$/, "") === productionOrigin;

if (isProductionBuild && process.env.INDEXNOW !== "off") {
  await submitToIndexNow(pages.map((page) => `${siteUrl}${page.path}`));
} else {
  const why = isProductionBuild ? "INDEXNOW=off" : `this build is for ${siteUrl}, not ${productionOrigin}`;
  console.log(`generate-sitemap: IndexNow not submitted (${why})`);
}
