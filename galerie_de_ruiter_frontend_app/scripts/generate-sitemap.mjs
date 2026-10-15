/**
 * Writes the two files a search engine looks for into the built site: `sitemap.xml` and the
 * `Sitemap:` and `Agentmap:` lines inside `robots.txt`.
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
const distDir = path.join(appRoot, "dist");

/**
 * The pages a visitor reaches without an account. Everything else answers with the sign-in
 * page and is disallowed in robots.txt, so it does not belong in a sitemap. `/home` is the
 * landing page: `/` and the old `/dashboard` redirect there, so a sitemap listing them would
 * list a redirect.
 */
const publicPages = [
  { path: "/home", changefreq: "weekly", priority: "1.0" },
  { path: "/about", changefreq: "monthly", priority: "0.8" },
  { path: "/map", changefreq: "monthly", priority: "0.8" },
  { path: "/chat", changefreq: "monthly", priority: "0.6" },
];

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
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...publicPages.map((page) => [
    "  <url>",
    `    <loc>${escapeXml(`${siteUrl}${page.path}`)}</loc>`,
    `    <lastmod>${lastmod}</lastmod>`,
    `    <changefreq>${page.changefreq}</changefreq>`,
    `    <priority>${page.priority}</priority>`,
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
// `Agentmap:` is how Agentic Resource Discovery advertises the manifest from robots.txt, and its
// value is an absolute URL, like the `Sitemap:` line under it. It names /.well-known/ard.json,
// because that is the path a conforming consumer must fetch: /.well-known/ai-catalog.json is the
// predecessor path the specification superseded, which a consumer may check but need not.
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
    `${robots}\n\nAgentmap: ${siteUrl}/.well-known/ard.json\nSitemap: ${siteUrl}/sitemap_index.xml\n`,
    "utf8",
  );
} else {
  console.warn("generate-sitemap: no robots.txt to add the Sitemap line to");
}

console.log(`generate-sitemap: ${publicPages.length} URLs for ${siteUrl} (sitemap_index.xml)`);
