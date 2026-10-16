import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

/**
 * IndexNow ties two files together: the key a build submits, and the text file the search engines
 * fetch to prove the domain owns it. The file must sit at the site root and be named after the key,
 * and a build submits only when it is building for the production origin.
 *
 * Both halves are worth a test, because getting either wrong is quiet: a mismatched key answers 403
 * to every submission while the build stays green, and a build for a staging origin would announce
 * URLs a crawler cannot fetch.
 */
const appRoot = join(__dirname, "..");
const script = readFileSync(join(appRoot, "scripts", "generate-sitemap.mjs"), "utf8");
const key = /const INDEXNOW_KEY = "([^"]+)"/.exec(script)?.[1];

describe("the IndexNow key", () => {
  it("is submitted and hosted from one value", () => {
    expect(key).toBeDefined();
    // The file is named after the key and contains the key - nothing else, no trailing newline.
    expect(readFileSync(join(appRoot, "public", `${key}.txt`), "utf8")).toBe(key);
  });

  it("follows the protocol: 8 to 128 characters, letters, digits or dashes", () => {
    // The engines reject a key outside that shape (IndexNow's documentation), and the file name has
    // to be the key itself, which is why this reads the directory rather than trusting the path.
    expect(key).toMatch(/^[0-9a-zA-Z-]{8,128}$/);
    expect(readdirSync(join(appRoot, "public"))).toContain(`${key}.txt`);
  });

  it("announces nothing from a build that is not a deploy", () => {
    // The guard that keeps a local or CI build from announcing content nobody has deployed. The
    // script writes the sitemap either way, so its output is what says whether it submitted - and it
    // writes into a directory of our own, so running it here cannot disturb what a build left in
    // dist/ (which other tests read).
    const outputDir = mkdtempSync(join(tmpdir(), "galerie-sitemap-"));
    const output = execFileSync(process.execPath, [join(appRoot, "scripts", "generate-sitemap.mjs")], {
      cwd: appRoot,
      encoding: "utf8",
      env: { ...process.env, SITE_URL: "http://localhost:3000", INDEXNOW: "", SITEMAP_DIST_DIR: outputDir },
    });

    expect(output).toContain("IndexNow not submitted");
    // And it still wrote the sitemap, naming the origin it was built for rather than the gallery's.
    expect(readFileSync(join(outputDir, "robots.txt"), "utf8"))
      .toContain("Sitemap: http://localhost:3000/sitemap_index.xml");
  });
});