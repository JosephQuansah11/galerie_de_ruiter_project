import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * The routes the application draws, and the two servers that have to hand them the shell.
 *
 * Every page is drawn by the bundle, so a server has exactly one job here: answer a path the
 * application knows with `index.html`, and answer a path it does not know with a 404. The catch-all
 * rewrite the static deployment used to carry did the first and could not do the second - a typo
 * was answered with the landing page and HTTP 200, which is how a site ends up with hundreds of
 * indexed error pages, and what an audit reported. So both deployments name the routes instead,
 * and this test is what keeps the two lists and the router in step: a route added to
 * `src/ProtectedRoutes.tsx` that no rule covers is a deep link that 404s for a visitor who follows
 * it and, for a crawler, a page that is not there at all.
 *
 * The two deployments fail differently and that is deliberate. Render applies no rule to a path
 * where a file exists, so a real file always wins, and a path nothing matches gets Render's own
 * 404. nginx is handed the same list as one regular expression and answers everything else with
 * `error_page 404` and the gallery's own page.
 */
const appRoot = join(__dirname, "..");
const read = (...parts: string[]) => readFileSync(join(appRoot, ...parts), "utf8");

/** Every path the router declares, from both route tables. The in-app catch-alls (`*`, `/*`) are
 * not paths a visitor types: they are what the application does with a path nothing matched. */
const routerPaths = [...new Set(
  ["src/AppContent.tsx", "src/ProtectedRoutes.tsx"]
    .flatMap((file) => [...read(file).matchAll(/path="([^"]+)"/g)].map(([, path]) => path)),
)].filter((path) => !path.includes("*"));

/** The rewrite rules of the static deployment, in the order Render reads them. */
const rewrites = [...read("..", "render.yaml").matchAll(/- type: rewrite\r?\n\s*source: (\S+)\r?\n\s*destination: (\S+)/g)]
  .map(([, source, destination]) => ({ source, destination }));

/** A Render `source` as a regular expression: `*` is the one wildcard its paths know. */
const matches = (source: string, path: string) =>
  new RegExp(`^${source.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*")}$`).test(path);

const nginx = read("nginx.conf");
/** The route segments the container deployment hands the shell, from its one route location. */
const nginxRoutes = /location ~ \^\/\(([^)]+)\)/.exec(nginx)?.[1].split("|") ?? [];

describe("serving the application's routes", () => {
  it("hands the shell to every path the router draws", () => {
    expect(routerPaths.length).toBeGreaterThan(10);
    for (const path of routerPaths) {
      const covered = rewrites.some((rule) => matches(rule.source, path));
      expect({ path, covered }).toEqual({ path, covered: true });
      // The container deployment matches the same paths on their first segment.
      expect({ path, segment: nginxRoutes.includes(path.split("/")[1]) })
        .toEqual({ path, segment: true });
    }
  });

  it("rewrites every one of them to the shell, and nothing else", () => {
    for (const rule of rewrites) expect(rule.destination).toBe("/index.html");
    // A catch-all is the one rule that makes a 404 impossible, so there must not be one.
    expect(rewrites.map((rule) => rule.source)).not.toContain("/*");
    expect(nginx).not.toMatch(/try_files \$uri \$uri\/ \/index\.html/);
  });

  it("answers a path the router does not draw with a 404 and a page", () => {
    expect(nginx).toContain("error_page 404 /404.html;");
    expect(existsSync(join(appRoot, "public", "404.html"))).toBe(true);
    expect(existsSync(join(appRoot, "public", "404.css"))).toBe(true);
    // A 404 page that asks to be indexed is an error page in the results.
    expect(read("public", "404.html")).toMatch(/name="robots" content="noindex/);
  });
});
