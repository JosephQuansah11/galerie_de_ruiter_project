import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * The landing page shows one separator between its sections, and the gallery has asked twice now
 * for it to be one. The story opens with a full-width rule; the hero above it and the cards below
 * it each used to draw their own, narrower ones, so the page showed a short line and a long one
 * where a single rule belongs.
 *
 * This reads the stylesheets rather than the rendered page, because that is where the mistake is
 * made and where it is cheapest to catch: a `border-top`/`border-bottom` added to a `.welcome-`
 * rule is what brings the second line back. Boxes are not separators, so the slider's and the
 * cards' full `border` are left alone.
 */
const styles = __dirname;

describe("the landing page's separators", () => {
  it("are drawn by the story alone", () => {
    const offenders: string[] = [];
    for (const name of readdirSync(styles).filter((file) => file.endsWith(".scss"))) {
      const text = readFileSync(join(styles, name), "utf8");
      for (const match of text.matchAll(/\.welcome-[a-z-]+[^{]*\{[^}]*\}/g)) {
        const rule = match[0];
        if (!/border-(top|bottom)\s*:/.test(rule)) continue;
        if (/^\.welcome-story\b/.test(rule)) continue;
        offenders.push(`${name}: ${rule.split("{")[0].trim()}`);
      }
    }

    expect(offenders).toEqual([]);
  });
});
