import fs from "fs";
import path from "path";

/**
 * The stylesheets are split so that no file is taller than a screenful: a change to one screen
 * then touches one small file instead of a thousand-line stylesheet. The parts are pulled in by an
 * index file (`_shell.scss` imports `_shell-01-…` through `_shell-38-…`), which is why a part that
 * no index imports is not a style problem but a bug: its rules never reach the bundle.
 */
const MAX_LINES = 50;
const stylesDirectory = __dirname;
const entry = "App.scss";

const stylesheets = fs
  .readdirSync(stylesDirectory)
  .filter((file) => /\.(scss|css)$/.test(file))
  .sort();

const read = (file: string) => fs.readFileSync(path.join(stylesDirectory, file), "utf8");

const lineCount = (file: string) => read(file).replace(/\r?\n$/, "").split("\n").length;

/** The names this stylesheet imports, without their extension (Sass resolves `_name.scss`). */
const imports = (file: string) =>
  read(file)
    .split(/\r?\n/)
    .filter((line) => line.startsWith("@import"))
    .map((line) => line.match(/"([^"]+)"/)?.[1])
    .filter((name): name is string => Boolean(name));

/** Sass treats `_name.scss` and `name` as the same stylesheet, and imports use both spellings. */
const stylesheetName = (name: string) => name.replace(/^_/, "").replace(/\.(scss|css)$/, "");

describe("stylesheet layout", () => {
  it("finds the stylesheets, starting with the entry point", () => {
    expect(stylesheets).toContain(entry);
    expect(stylesheets.length).toBeGreaterThan(50);
  });

  it(`keeps every stylesheet within ${MAX_LINES} lines`, () => {
    const oversized = stylesheets
      .filter((file) => lineCount(file) > MAX_LINES)
      .map((file) => `${file} has ${lineCount(file)} lines`);

    expect(oversized).toEqual([]);
  });

  it("reaches every stylesheet from the entry point, so no rule is left out of the bundle", () => {
    const reachable = new Set([entry]);
    const walk = (file: string) => {
      for (const name of imports(file)) {
        const next = stylesheets.find((candidate) => stylesheetName(candidate) === stylesheetName(name));
        if (next && !reachable.has(next)) {
          reachable.add(next);
          walk(next);
        }
      }
    };
    walk(entry);

    expect(stylesheets.filter((file) => !reachable.has(file))).toEqual([]);
  });
});
