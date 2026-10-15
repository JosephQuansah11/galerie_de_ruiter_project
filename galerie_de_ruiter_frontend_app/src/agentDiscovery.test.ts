import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * The files agents and registries look for by convention, and the reason they exist.
 *
 * Lighthouse's agentic-browsing audit asks for a valid `ai-catalog.json` manifest and for an
 * `llms.txt` that follows the format. This site is a single-page application served with a
 * catch-all rewrite, so a request for a file that is not there does not 404: it answers with
 * `index.html` and HTTP 200. A crawler then tries to parse a document as JSON and reports
 * "Malformed JSON in manifest: Unexpected token '<'". Shipping the files is what fixes that, and
 * these tests are what keep them valid, on the gallery's own origin, and copied into the build.
 *
 * The ARD entry schema (spec/schemas/ard-entry.schema.json, restated in ard.cddl) requires
 * `identifier` as a domain-anchored URN, `displayName`, `type` as an IANA media type, and exactly
 * one of `url` or `data`; `representativeQueries` is recommended and is what a registry searches
 * by. ARD reads only `entries`, so the `specVersion` and `host` blocks are the AI Catalog envelope
 * the same document satisfies for a consumer that reads it that way.
 */
const appRoot = join(__dirname, "..");
const read = (...parts: string[]) => readFileSync(join(appRoot, ...parts), "utf8");

const llmsTxt = read("public", "llms.txt");
const catalogFile = read("public", ".well-known", "ai-catalog.json");
const ardFile = read("public", ".well-known", "ard.json");
const robots = read("public", "robots.txt");
const document = read("index.html");
const webpack = read("webpack.config.js");
const sitemapScript = read("scripts", "generate-sitemap.mjs");
// The origin the site is built for, from the one module that decides it (see site.config.mjs).
const origin = /PRODUCTION_ORIGIN\s*=\s*"([^"]+)"/.exec(read("site.config.mjs"))![1];
const host = new URL(origin).host;
const catalog = JSON.parse(catalogFile) as {
  specVersion?: string;
  host?: { displayName?: string; identifier?: string };
  entries?: Array<Record<string, unknown>>;
};

describe("the agent guide", () => {
  it("opens with the H1 the format requires", () => {
    // The audit fails a file with no H1, one with no Markdown link, and one shorter than 50
    // characters. The H1 is the only required section.
    expect(llmsTxt.startsWith("# ")).toBe(true);
    expect(llmsTxt.length).toBeGreaterThan(50);
  });

  it("links to the pages with Markdown links, not bare URLs", () => {
    // A plain URL is not a link as far as the audit is concerned, so this checks the shape.
    const links = llmsTxt.match(/\[[^\]]+\]\((https:\/\/[^)]+)\)/g) ?? [];
    expect(links.length).toBeGreaterThanOrEqual(5);
  });

  it("points every link at the origin the site is built for", () => {
    const urls = [...llmsTxt.matchAll(/\((https:\/\/[^)]+)\)/g)].map(([, url]) => url);
    expect(urls.length).toBeGreaterThan(0);
    for (const url of urls) expect(url.startsWith(`${origin}/`)).toBe(true);
  });

  it("describes the pages a visitor can read without an account", () => {
    for (const page of ["/home", "/about", "/map", "/chat"]) expect(llmsTxt).toContain(`${origin}${page}`);
    // The catalogue is behind the sign-in page, so the guide says so rather than sending a visitor
    // to a redirect.
    expect(llmsTxt).toContain("/antiques");
  });
});

describe("the agent catalog", () => {
  it("carries the manifest envelope and at least one entry", () => {
    expect(catalog.specVersion).toBe("1.0");
    expect(catalog.host?.displayName).toBeTruthy();
    expect(catalog.host?.identifier).toBe(host);
    expect(catalog.entries?.length).toBeGreaterThan(0);
  });

  it("gives every entry the fields the schema requires, and a value or a reference", () => {
    for (const entry of catalog.entries ?? []) {
      expect(entry.displayName).toBeTruthy();
      expect(String(entry.type)).toMatch(/^[a-z]+\/[a-z0-9.+-]+$/i);
      // Exactly one of the two: the schema makes it a strict value-or-reference choice.
      const hasUrl = typeof entry.url === "string";
      const hasData = typeof entry.data === "object" && entry.data !== null;
      expect(hasUrl !== hasData).toBe(true);
      expect(String(entry.url ?? "")).toMatch(new RegExp(`^${origin}/`));
    }
  });

  it("names every entry with a URN anchored to the gallery's own domain", () => {
    // urn:air:<publisher>:<namespace>:<agent-name>, where the publisher is the host that serves
    // the manifest - the alignment a registry checks before it trusts an entry.
    for (const entry of catalog.entries ?? []) {
      expect(String(entry.identifier)).toMatch(new RegExp(`^urn:air:${host.replace(/\./g, "\\.")}:[^:]+:[^:]+$`));
    }
  });

  it("gives every entry the 2-5 representative queries a registry searches by", () => {
    for (const entry of catalog.entries ?? []) {
      const queries = entry.representativeQueries as unknown[];
      expect(Array.isArray(queries)).toBe(true);
      expect(queries.length).toBeGreaterThanOrEqual(2);
      expect(queries.length).toBeLessThanOrEqual(5);
    }
  });

  it("is served at both paths a consumer may ask for", () => {
    // The current Agentic Resource Discovery specification names /.well-known/ard.json; the
    // predecessor path it falls back to - and the one Lighthouse's audit fetches - is
    // /.well-known/ai-catalog.json. One document, two paths, so they cannot drift apart.
    expect(ardFile).toBe(catalogFile);
  });
});

describe("advertising the catalog", () => {
  it("names it in robots.txt, at the path a consumer is required to consult", () => {
    // `Agentmap:` is how Agentic Resource Discovery advertises a manifest from robots.txt, and its
    // value is an absolute URL - the form `Sitemap:` takes as well, and the reason neither line is
    // written in public/robots.txt: the origin is only known at build time, when the script below
    // appends them. The line names /.well-known/ard.json, the path a conforming consumer must
    // fetch; /.well-known/ai-catalog.json is the predecessor path it may check but need not.
    expect(robots).not.toMatch(/^(Agentmap|Sitemap):/im);
    expect(sitemapScript).toContain("Agentmap: ${siteUrl}/.well-known/ard.json");
    expect(sitemapScript).toContain("Sitemap: ${siteUrl}/sitemap_index.xml");
    // A line left in the file by an earlier build is stale, so it is replaced rather than kept.
    expect(sitemapScript).toMatch(/\/\^\(Sitemap\|Agentmap\):/i);
  });

  it("names it in the document, so a crawler does not have to guess the path", () => {
    // Two relations, one document: rel="ai-catalog" is the AI Catalog relation, and rel="ard" is
    // the one Agentic Resource Discovery v0.91 names in its place. A consumer must honour the
    // latter, which makes it a real alternative to the well-known path rather than a hint.
    expect(document).toContain('<link rel="ai-catalog" href="/.well-known/ai-catalog.json" />');
    expect(document).toContain('<link rel="ard" href="/.well-known/ard.json" />');
    expect(document).toContain('<link rel="describedby" type="text/markdown" href="/llms.txt" />');
  });

  it("copies the .well-known directory into the build", () => {
    // A glob skips dot files and dot directories unless it is told otherwise, and the manifest
    // lives in one: without this the file is committed, tested - and absent from the site.
    expect(webpack).toMatch(/dot:\s*true/);
  });
});
