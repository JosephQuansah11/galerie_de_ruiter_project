import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Nothing the gallery ships writes to the browser console.
 *
 * A `console.log` left in a bundle is noise a visitor can open the developer tools and find, and
 * the failures that matter here already reach the person who can act on them: the forms and the
 * admin table show a message, and the API's status is turned into copy by `antiqueSaveErrors` and
 * its neighbours. This guard fails the suite rather than waiting for someone to notice the console,
 * the same way `stylesheetBudget.test.ts` fails on an oversized stylesheet.
 *
 * Build scripts are deliberately out of scope: `scripts/generate-sitemap.mjs` reports what it wrote
 * on the command line, which is the only way a build step can say anything, and that output never
 * reaches a browser. The API is out of scope too, and has no `System.out`/`printStackTrace` calls -
 * it logs through slf4j.
 */
const sourceRoot = __dirname;

function sources(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) sources(full, out);
    else if (/\.tsx?$/.test(entry.name)) out.push(full);
  }
  return out;
}

describe("the browser console", () => {
  it("is never written to from the application's source", () => {
    const offenders = sources(sourceRoot)
      // The tests themselves are allowed to speak; the application is not.
      .filter((file) => !/\.test\.tsx?$/.test(file))
      .filter((file) => /\bconsole\s*\./.test(readFileSync(file, "utf8")))
      .map((file) => file.slice(sourceRoot.length + 1).replace(/\\/g, "/"));

    expect(offenders).toEqual([]);
  });
});
