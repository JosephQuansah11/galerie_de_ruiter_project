import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * The security headers are sent twice: by `nginx.conf` for the container deployment, and by the
 * `headers` block of `render.yaml` for the static one, where there is nothing at the origin to
 * inject them. The two are written by hand, in different syntaxes, so this holds them together: a
 * header added to one and forgotten in the other, or a policy that drifts, fails here rather than
 * quietly weakening whichever deployment nobody looked at.
 *
 * The second half checks the policy against the code: the origins the app is built to talk to, the
 * frames it opens, and the style attributes it sets. A policy that forbids any of those breaks the
 * gallery the moment it is switched on.
 */
const appRoot = join(__dirname, "..");
const nginx = readFileSync(join(appRoot, "nginx.conf"), "utf8");
const blueprint = readFileSync(join(join(appRoot, ".."), "render.yaml"), "utf8");

/** What the container deployment substitutes into the policy at build time (see the Dockerfile). */
const substituted = {
  "${CSP_API_ORIGIN}": "https://galerie-java-api.onrender.com",
  "${CSP_KEYCLOAK_ORIGIN}": "https://galerie-keycloak.onrender.com",
};

const expand = (value: string) =>
  Object.entries(substituted).reduce((text, [token, origin]) => text.split(token).join(origin), value);

/** `add_header Name "value" always;` from nginx.conf, keyed by lower-case name. */
function fromNginx(): Record<string, string> {
  const headers: Record<string, string> = {};
  for (const [, name, value] of nginx.matchAll(/add_header\s+([A-Za-z-]+)\s+"([^"]+)"\s+always;/g)) {
    headers[name.toLowerCase()] = expand(value);
  }
  return headers;
}

/** The `headers:` list of the frontend service in render.yaml, keyed by lower-case name. */
function fromBlueprint(): Record<string, string> {
  const headers: Record<string, string> = {};
  const block = blueprint.slice(blueprint.indexOf("\n    headers:"));
  const entries = block.matchAll(/\n\s{6}- path:.*\r?\n\s{8}name:\s*(.+?)\r?\n\s{8}value:\s*"?([^"\r\n]+)"?/g);
  for (const [, name, value] of entries) headers[name.trim().toLowerCase()] = value.trim();
  return headers;
}

/** The value of one `envVars` entry of the frontend service, for the origins the app is built with. */
function frontendEnv(key: string): string {
  const service = blueprint.slice(blueprint.indexOf("name: galerie-frontend"));
  const match = new RegExp(`- key: ${key}\\r?\\n\\s+value: (\\S+)`).exec(service);
  if (!match) throw new Error(`${key} is not set for the frontend service in render.yaml`);
  return match[1];
}

const cspOf = (headers: Record<string, string>) => headers["content-security-policy"].split(";").map((part) => part.trim());
const directive = (policy: string[], name: string) => policy.find((part) => part === name || part.startsWith(`${name} `));

describe("security headers", () => {
  it("sends the same headers from nginx and from the Render blueprint", () => {
    const nginxHeaders = fromNginx();
    const blueprintHeaders = fromBlueprint();
    // Two headers are deliberately one-sided: Render sends nosniff itself (its own default), and
    // the report-only Trusted Types policy is staged for the container deployment, which has a
    // report endpoint and an nginx to move the directives in.
    const containerOnly = ["x-content-type-options", "content-security-policy-report-only"];
    const expected = Object.keys(nginxHeaders).filter((name) => !containerOnly.includes(name)).sort();
    expect(Object.keys(blueprintHeaders).sort()).toEqual(expected);
  });

  it("sends the same policy from both", () => {
    expect(fromBlueprint()["content-security-policy"]).toBe(fromNginx()["content-security-policy"]);
  });

  it("sends the same value for every shared header", () => {
    const nginxHeaders = fromNginx();
    for (const [name, value] of Object.entries(fromBlueprint())) {
      if (name === "content-security-policy") continue;
      expect([name, value]).toEqual([name, nginxHeaders[name]]);
    }
  });

  it("lets the page load what it is built to load", () => {
    const policy = cspOf(fromNginx());
    const api = frontendEnv("VITE_JAVA_API_URL");
    const keycloak = frontendEnv("VITE_KEYCLOAK_URL");
    // Every request the browser makes goes to the API, so both img-src and connect-src need it.
    expect(directive(policy, "img-src")).toContain(api);
    expect(directive(policy, "connect-src")).toContain(api);
    // Keycloak answers the sign-in check and frames the silent one.
    expect(directive(policy, "connect-src")).toContain(keycloak);
    expect(directive(policy, "frame-src")).toContain(keycloak);
    // The silent check's iframe is the gallery's own page, and the map is OpenStreetMap's.
    expect(directive(policy, "frame-src")).toContain("'self'");
    expect(directive(policy, "frame-src")).toContain("https://www.openstreetmap.org");
    // The type is self-hosted now, so no font origin may creep back in.
    expect(directive(policy, "font-src")).toBe("font-src 'self'");
    expect(policy.join("; ")).not.toContain("fonts.googleapis.com");
    expect(policy.join("; ")).not.toContain("fonts.gstatic.com");
  });

  it("allows the style attributes the pages set", () => {
    // The charts size their bars, the theme picker draws its swatches and the carousel positions
    // its slides with style attributes, which `style-src 'self'` alone would block.
    const inlineStyles = readFileSync(join(appRoot, "src", "components", "NavigationAccountMenu.tsx"), "utf8");
    expect(inlineStyles).toContain("style={{");
    expect(directive(cspOf(fromNginx()), "style-src-attr")).toBe("style-src-attr 'unsafe-inline'");
  });
});
