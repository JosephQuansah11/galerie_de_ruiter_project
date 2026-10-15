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
// The headers themselves live in `security-headers.conf`, which nginx.conf includes twice - for
// every response, and for the sign-out response - so the headers are read from there and
// nginx.conf is read for the locations that use them.
const securityHeaders = readFileSync(join(appRoot, "security-headers.conf"), "utf8");
const nginx = readFileSync(join(appRoot, "nginx.conf"), "utf8");
const dockerfile = readFileSync(join(appRoot, "Dockerfile"), "utf8");
const blueprint = readFileSync(join(join(appRoot, ".."), "render.yaml"), "utf8");

/** What the container deployment substitutes into the policy at build time (see the Dockerfile). */
const substituted = {
  "${CSP_API_ORIGIN}": "https://galerie-java-api.onrender.com",
  "${CSP_KEYCLOAK_ORIGIN}": "https://galerie-keycloak.onrender.com",
};

const expand = (value: string) =>
  Object.entries(substituted).reduce((text, [token, origin]) => text.split(token).join(origin), value);

/** `add_header Name "value" always;` from security-headers.conf, keyed by lower-case name. */
function fromNginx(): Record<string, string> {
  const headers: Record<string, string> = {};
  for (const [, name, value] of securityHeaders.matchAll(/add_header\s+([A-Za-z-]+)\s+"([^"]+)"\s+always;/g)) {
    headers[name.toLowerCase()] = expand(value);
  }
  return headers;
}

/**
 * The `headers` entries of the frontend service in render.yaml for one path, keyed by lower-case
 * name. The path is part of the question: the cache header and Clear-Site-Data are scoped to a
 * path rather than to the whole site.
 */
function fromBlueprint(path = "/*"): Record<string, string> {
  const headers: Record<string, string> = {};
  const block = blueprint.slice(blueprint.indexOf("\n    headers:"));
  for (const entry of block.split(/\r?\n\s{6}- path:/).slice(1)) {
    if (entry.slice(0, entry.indexOf("\n")).trim() !== path) continue;
    const name = /(?:^|\n)\s{8}name:\s*([^\r\n]+)/.exec(entry)?.[1]?.trim();
    const raw = /(?:^|\n)\s{8}value:\s*([^\r\n]+)/.exec(entry)?.[1]?.trim() ?? "";
    if (name) headers[name.toLowerCase()] = raw.replace(/^["']|["']$/g, "");
  }
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
    // One header is deliberately one-sided: Render sends nosniff itself, as its own default for a
    // static site, so listing it here as well would only be a second place to keep in step.
    const containerOnly = ["x-content-type-options"];
    // The cache header is not a security header and each side sets it with its own tool: nginx
    // with `expires`, Render with a path-specific header. It is checked separately below.
    const notShared = ["cache-control"];
    const expected = Object.keys(nginxHeaders).filter((name) => !containerOnly.includes(name)).sort();
    expect(Object.keys(blueprintHeaders).filter((name) => !notShared.includes(name)).sort()).toEqual(expected);
  });

  it("sends no Cross-Origin-Embedder-Policy, on purpose", () => {
    // COEP makes every cross-origin frame, image and script on the page declare a
    // Cross-Origin-Resource-Policy, and the resources this page loads are other people's: the Google
    // map and Keycloak's own pages. Keycloak sends no CORP and cannot be given one - it is not this
    // site's server. Its third-party-cookie probe, which keycloak-js loads in a hidden iframe, is
    // what COEP broke: the frame was refused, the adapter rejected on its ten-second timeout, and
    // the sign-in button did nothing. `credentialless`, the alternative the guidance offers, refuses
    // that frame too. Nothing here needs `crossOriginIsolated`, which is all COEP buys.
    expect(fromNginx()["cross-origin-embedder-policy"]).toBeUndefined();
    expect(fromBlueprint()["cross-origin-embedder-policy"]).toBeUndefined();
  });

  it("clears the browser's data on the sign-out response, and nowhere else", () => {
    // Clear-Site-Data belongs on the response that ends a session; sent site-wide it would drop the
    // visitor's language on any page load.
    expect(fromBlueprint("/logout")["clear-site-data"]).toBe('"cache", "cookies", "storage"');
    expect(fromBlueprint()["clear-site-data"]).toBeUndefined();
    // The container deployment serves the same path from nginx, and a location-level add_header
    // drops the inherited ones, so it includes them again there.
    expect(nginx).toContain("location = /logout {");
    expect(nginx).toContain(`add_header Clear-Site-Data '"cache", "cookies", "storage"' always;`);
    // ...and every location that includes it has to find it in the image, or those responses start
    // without any of these headers: the server level, the /.well-known/ location below - which adds
    // the discovery CORS headers on top - and this one.
    expect(nginx.match(/include \/etc\/nginx\/security-headers\.conf;/g) ?? []).toHaveLength(3);
    expect(dockerfile).toContain("COPY security-headers.conf /etc/nginx/security-headers.conf");
  });

  it("keeps the gallery type in the browser's cache on both deployments", () => {
    // Render's default for a file it does not fingerprint is max-age=0, which revalidates both
    // preloaded faces on every visit.
    expect(fromBlueprint("/fonts/*")["cache-control"]).toContain("max-age=31536000");
    expect(nginx).toContain("expires max;");
  });

  it("lets agents read the discovery files from their own origin, and nothing else", () => {
    // The manifest agents and registries look for (public/.well-known/) is fetched cross-origin by a
    // crawler, so the one directory that exists to be read from elsewhere grants that - in both
    // deployments - while every other response keeps same-origin.
    expect(fromBlueprint("/.well-known/*")["access-control-allow-origin"]).toBe("*");
    expect(fromBlueprint("/.well-known/*")["cross-origin-resource-policy"]).toBe("cross-origin");
    expect(fromBlueprint()["access-control-allow-origin"]).toBeUndefined();
    expect(nginx).toContain("location ^~ /.well-known/ {");
    expect(nginx).toContain('add_header Access-Control-Allow-Origin "*" always;');
  });

  it("stages Trusted Types in report-only mode on both deployments", () => {
    // The audit that looks for the directive reads the static deployment, and the container sends
    // the same policy, so the staged rollout cannot be half done.
    expect(fromBlueprint()["content-security-policy-report-only"]).toBe(fromNginx()["content-security-policy-report-only"]);
    expect(fromNginx()["content-security-policy-report-only"]).toContain("require-trusted-types-for 'script'");
  });

  it("sends the same policy from both", () => {
    expect(fromBlueprint()["content-security-policy"]).toBe(fromNginx()["content-security-policy"]);
  });

  it("sends the same value for every shared header", () => {
    const nginxHeaders = fromNginx();
    for (const [name, value] of Object.entries(fromBlueprint())) {
      if (name === "content-security-policy" || name === "cache-control") continue;
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
    // Keycloak answers the sign-in check.
    expect(directive(policy, "connect-src")).toContain(keycloak);
    expect(directive(policy, "frame-src")).toContain(keycloak);
    // The map is a Google Embed frame, and the administrator's address lookup calls Google's
    // geocoder, so both directives have to name Google and neither may name OpenStreetMap any more.
    expect(directive(policy, "frame-src")).toContain("https://www.google.com");
    expect(directive(policy, "connect-src")).toContain("https://maps.googleapis.com");
    // 'self' stays in frame-src: the gallery frames nothing of its own today, and a same-origin
    // frame is the one thing that value cannot break.
    expect(directive(policy, "frame-src")).toContain("'self'");
    expect(policy.join("; ")).not.toMatch(/openstreetmap|nominatim/i);
    // The type is self-hosted now, so no font origin may creep back in.
    expect(directive(policy, "font-src")).toBe("font-src 'self'");
    expect(policy.join("; ")).not.toContain("fonts.googleapis.com");
    expect(policy.join("; ")).not.toContain("fonts.gstatic.com");
  });

  it("keeps a foreign page from framing the gallery", () => {
    const policy = cspOf(fromNginx());
    // The gallery framed one of its own pages for the silent sign-in check until that check was
    // dropped, and that is why this pair is 'self'/SAMEORIGIN rather than 'none'/DENY: 'self' is the
    // tightest value that cannot break a same-origin frame. The clickjacking risk is closed either
    // way - a foreign page may not frame the gallery - so tightening to 'none' and DENY is safe
    // today, and this is the test that records the decision.
    expect(directive(policy, "frame-ancestors")).toBe("frame-ancestors 'self'");
    expect(fromNginx()["x-frame-options"]).toBe("SAMEORIGIN");
  });

  it("allows the style attributes the pages set", () => {
    // The charts size their bars, the theme picker draws its swatches and the carousel positions
    // its slides with style attributes, which `style-src 'self'` alone would block.
    const inlineStyles = readFileSync(join(appRoot, "src", "components", "NavigationAccountMenu.tsx"), "utf8");
    expect(inlineStyles).toContain("style={{");
    expect(directive(cspOf(fromNginx()), "style-src-attr")).toBe("style-src-attr 'unsafe-inline'");
  });
});
