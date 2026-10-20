import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import i18n from "@/i18n";

/**
 * What the document says about the gallery before the bundle has run.
 *
 * The application draws every page from JavaScript, so a crawler that reads the document and stops
 * - and a visitor whose browser cannot run it - has only what `index.html` carries. An audit read
 * exactly that and reported four things about the landing page: 43 words, no structured data, two
 * top-level headings, and a description that did not name the gallery's trade or its town. The
 * tests below are those four findings, so that a rewrite of the document has to keep answering
 * them.
 *
 * They read the template rather than a build, so they run in a second and fail before a deploy.
 * The one thing they cannot see is what the minifier makes of it: `npm run build` writes
 * `dist/index.html`, and the JSON-LD block is the thing to look at there, because a data block
 * that comes out as JavaScript is a data block a search engine cannot read.
 */
const appRoot = join(__dirname, "..");
const read = (...parts: string[]) => readFileSync(join(appRoot, ...parts), "utf8");
const indexHtml = readFileSync(join(appRoot, "index.html"), "utf8");
/** The origin the build fills the template in with, from the one module that decides it. */
const origin = /PRODUCTION_ORIGIN\s*=\s*"([^"]+)"/.exec(readFileSync(join(appRoot, "site.config.mjs"), "utf8"))![1];
const document = new DOMParser().parseFromString(indexHtml, "text/html");
/** The document is written in the gallery's own language, the one it can know before it is read. */
const gallery = i18n.getFixedT("nl-BE");
const content = (selector: string) => document.querySelector(selector)?.getAttribute("content") ?? undefined;

describe("the document, read without the bundle", () => {
  it("describes the gallery the way the landing page will", () => {
    const description = content('meta[name="description"]');
    // The same sentence the page sets at runtime: a visitor must not watch it change, and a search
    // engine must not have to choose between two descriptions of one page.
    expect(description).toBe(gallery("metaHomeDescription"));
    expect(content('meta[property="og:description"]')).toBe(description);
    // A result shows about 160 characters of it; anything past that is written and never read.
    expect(description!.length).toBeLessThanOrEqual(160);
  });

  it("allows large image previews and declares a share image", () => {
    // Google Images and Discover use the large-preview permission; the logo is the document's
    // default until a piece page puts its own photograph in og:image.
    expect(content('meta[name="robots"]')).toBe("index, follow, max-image-preview:large");
    expect(content('meta[property="og:image:alt"]')).toBe("Galerie de Ruiter");
    expect(content('meta[name="twitter:card"]')).toBe("summary_large_image");
    // The template still carries the origin placeholder; webpack fills it in at build time.
    expect(content('meta[name="twitter:image"]')).toContain("/logo512.png");
  });

  it("carries the tags that prove the domain to the search engines", () => {
    // The gallery verifies the domain by serving these tags: Search Console reads
    // google-site-verification, Bing Webmaster Tools reads msvalidate.01. A rewrite of the head that
    // dropped either would leave that property unverified, which is reported as a lost property
    // rather than as a missing tag - so both values are pinned here rather than left to the head's
    // history.
    expect(content('meta[name="google-site-verification"]')).toBe("IaJnT_8DR-TKcufSWA6b6NXIpdTr0HWM_ESjn8dTZZk");
    expect(content('meta[name="msvalidate.01"]')).toBe("AAC8AEE642559AB3391A1E00FD2ABCAB");
  });

  it("has one top-level heading", () => {
    // The first screen carries it. The <noscript> block used to carry a second one, which is the
    // page with two top-level headings that the audit reported.
    expect(document.querySelectorAll("h1")).toHaveLength(1);
    expect(document.querySelector("noscript h1")).toBeNull();
  });

  it("carries structured data a search engine can read", () => {
    const block = document.querySelector('script[type="application/ld+json"]');
    expect(block).not.toBeNull();
    // The template writes the origin in at build time, so the placeholder stands in for it here -
    // and parsing it is also what proves the block is JSON rather than something that merely looks
    // like it.
    const json = JSON.parse(block!.textContent!.replaceAll("<%= htmlWebpackPlugin.options.siteUrl %>", origin)) as Record<string, unknown>;
    type Node = Record<string, unknown>;
    const nodes = json["@graph"] as Node[];
    expect(json["@context"]).toBe("https://schema.org");

    const galleryNode = nodes.find((node) => node["@type"] === "ArtGallery")!;
    const address = galleryNode.address as Node;
    expect(galleryNode.name).toBe("Galerie de Ruiter");
    expect(address.addressLocality).toBe("Waasmunster");
    expect(address.addressCountry).toBe("BE");
    expect(String(galleryNode.url)).toMatch(new RegExp(`^${origin}/`));
    // The street address and the opening hours are records the gallery edits, shown on /map and
    // /about, so the document must not carry a copy: the copy is what goes stale.
    expect(galleryNode.streetAddress).toBeUndefined();
    expect(galleryNode.openingHoursSpecification).toBeUndefined();
    // Its Instagram profile, as the same entity, so a search engine can tie the two together. The
    // footer links to the profile as well, but a link from a page says far less than this does.
    expect(galleryNode.sameAs).toEqual(["https://www.instagram.com/galerie_de_ruiter/"]);

    const siteNode = nodes.find((node) => node["@type"] === "WebSite")!;
    expect(siteNode.inLanguage).toBe("nl-BE");
    expect(String(siteNode.url)).toBe(`${origin}/`);
    // The two nodes name each other, which is how a search engine reads the site as the gallery's.
    expect((siteNode.publisher as Node)["@id"]).toBe(galleryNode["@id"]);
  });

  it("says enough about the gallery to be worth reading", () => {
    const words = (document.getElementById("root")?.textContent ?? "").trim().split(/\s+/).filter(Boolean);
    // The audit's threshold, and a floor rather than a target: a page of forty words gives a search
    // engine nothing to work out what it is about. The copy is the gallery's own account of itself,
    // in its own language, for the crawler and the visitor that cannot run the bundle.
    expect(words.length).toBeGreaterThanOrEqual(300);
  });
});

/** The paths the router draws, so a page's canonical URL can be checked against them. */
const routerPaths = [...new Set(
  ["src/AppContent.tsx", "src/ProtectedRoutes.tsx"]
    .flatMap((file) => [...read(file).matchAll(/path="([^"]+)"/g)].map(([, path]) => path)),
)].filter((path) => !path.includes("*"));
/** `/antiques/${id}` and `/antiques/:id` are the same URL written two ways. */
const normalise = (path: string) => path.replace(/\$\{[^}]+\}/g, ":").replace(/:[a-zA-Z]+/g, ":");

/** Every page component that declares a canonical URL, and the URL it declares. */
function declaredCanonicals(): Array<{ file: string; path: string }> {
  const found: Array<{ file: string; path: string }> = [];
  const walk = (directory: string) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const full = join(directory, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith(".tsx") && !entry.name.endsWith(".test.tsx")) {
        const match = /canonicalPath: (["`])([^"`]+)/.exec(readFileSync(full, "utf8"));
        if (match) found.push({ file: full.slice(appRoot.length + 1), path: match[2] });
      }
    }
  };
  walk(join(appRoot, "src", "pages"));
  return found;
}

describe("the canonical URLs", () => {
  it("leaves them to the pages, because the document is served for every route", () => {
    // A canonical in the document names one URL for all of them, and every page it named was
    // reported as "canonical to a different URL" - an instruction to drop it from the index.
    expect(document.querySelector('link[rel="canonical"]')).toBeNull();
  });

  it("gives every page its own, and the landing page the root", () => {
    const declared = declaredCanonicals();
    // The four public pages, both sign-in pages, the catalogue, a piece's page and the dashboard.
    expect(declared.length).toBeGreaterThanOrEqual(8);
    // No page may canonicalise to a URL the application does not serve: a canonical that names
    // somewhere else is a request to index that page instead of this one.
    for (const { file, path } of declared) {
      const served = routerPaths.some((route) => normalise(route) === normalise(path));
      expect({ file, path, served }).toEqual({ file, path, served: true });
    }
    // The landing page's URL is the root: `/` cannot be redirected (Render applies no rule to a
    // domain root), so the root is the address that is canonical and `/home` redirects to it.
    expect(declared.find(({ file }) => file.endsWith("WelcomePage.tsx"))?.path).toBe("/");
  });
});
