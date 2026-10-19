/**
 * Microsoft Clarity, started only after the visitor agrees to it.
 *
 * Clarity records sessions and sets cookies, so it is not loaded on page load. `AnalyticsConsent`
 * asks first and `Preferences` can change the answer later; this module remembers the choice, keeps
 * the vendor tag out of the page until it is granted, and tells Clarity when it is withdrawn.
 *
 * The tag is injected from here rather than pasted into `index.html` for two reasons: the site's
 * CSP has no `'unsafe-inline'`, and an inline snippet would need one; and a tag in the document
 * would load before anyone had a chance to decline. The script is external and same-origin, and
 * `script-src` names only the Clarity origins (see `security-headers.conf`).
 */
const PROJECT_ID = "z0549z8r1v";
const CONSENT_KEY = "galerie-analytics-consent";
/** The hosts the gallery's Clarity project belongs to; previews and localhost stay out. */
const PRODUCTION_HOSTS = new Set([
  // The domain the gallery owns, which every page declares canonical.
  "galeriederuiterantieks.gripe",
  // The free subdomain the gallery used before it; still served while the move settles.
  "galeriederuiter.cloud-ip.cc",
]);
const SCRIPT_URL = `https://www.clarity.ms/tag/${PROJECT_ID}?ref=bwt`;

export type AnalyticsChoice = "granted" | "denied";

type ClarityCommand = ((...args: unknown[]) => void) & { q?: unknown[][] };
type ClarityWindow = Window & { clarity?: ClarityCommand };

/** Whether this page is the gallery's real site, rather than a preview or a test run. */
export const isAnalyticsHost = (hostname: string): boolean => PRODUCTION_HOSTS.has(hostname);

export const analyticsAvailable = (): boolean =>
  typeof window !== "undefined" && isAnalyticsHost(window.location.hostname);

/** The stored answer, or null when the visitor has not been asked yet. */
export const analyticsChoice = (): AnalyticsChoice | null => {
  try {
    const stored = window.localStorage.getItem(CONSENT_KEY);
    return stored === "granted" || stored === "denied" ? stored : null;
  } catch {
    return null;
  }
};

const remember = (choice: AnalyticsChoice): void => {
  try {
    window.localStorage.setItem(CONSENT_KEY, choice);
  } catch {
    // A storage that refuses still gets a working choice for this page load.
  }
};

/** The queue the vendor snippet fills until Microsoft's script has answered. */
const clarity = (): ClarityCommand => {
  const existing = (window as ClarityWindow).clarity;
  if (existing) return existing;
  const queued = ((...args: unknown[]) => {
    queued.q = queued.q ?? [];
    queued.q.push(args);
  }) as ClarityCommand;
  (window as ClarityWindow).clarity = queued;
  return queued;
};

/**
 * A Trusted Types policy for the one script URL this module sets.
 *
 * The site sends `require-trusted-types-for 'script'` in report-only mode. Webpack's chunk loader
 * already has a policy named `default`; this named one keeps the Clarity injection from being
 * reported as a violation, and the policy directive allows both by name.
 */
type TrustedPolicy = { createScriptURL: (value: string) => unknown };
type TrustedTypesFactory = {
  createPolicy: (name: string, rules: { createScriptURL: (value: string) => string }) => TrustedPolicy;
};

let policy: TrustedPolicy | null | undefined;
const trustedUrl = (url: string): string => {
  if (typeof window === "undefined") return url;
  const factory = (window as Window & { trustedTypes?: TrustedTypesFactory }).trustedTypes;
  if (!factory) return url;
  if (policy === undefined) {
    try {
      policy = factory.createPolicy("clarity", {
        createScriptURL: (value: string) => value,
      });
    } catch {
      policy = null;
    }
  }
  return policy ? String(policy.createScriptURL(url)) : url;
};

/** Injects the vendor tag once, on the gallery's host, and grants the stored consent. */
const load = (hostname: string): void => {
  if (!isAnalyticsHost(hostname)) return;
  const client = clarity();
  if (document.querySelector("script[data-galerie-clarity]")) return;
  const script = document.createElement("script");
  script.async = true;
  script.dataset.galerieClarity = "true";
  script.src = trustedUrl(SCRIPT_URL);
  document.head.appendChild(script);
  client("consentv2", { ad_Storage: "granted", analytics_Storage: "granted" });
};

/** Starts Clarity on a returning visit where the answer was already yes. */
export const startAnalytics = (hostname: string = window.location.hostname): void => {
  if (analyticsChoice() === "granted") load(hostname);
};

/** Records consent and starts the tag (or re-grants it if it was withdrawn earlier). */
export const grantAnalytics = (hostname: string = window.location.hostname): void => {
  remember("granted");
  if (!isAnalyticsHost(hostname)) return;
  if (document.querySelector("script[data-galerie-clarity]")) {
    clarity()("consentv2", { ad_Storage: "granted", analytics_Storage: "granted" });
    return;
  }
  load(hostname);
};

/** Withdraws consent; Clarity deletes its cookies and stops tracking until a new grant. */
export const denyAnalytics = (): void => {
  remember("denied");
  (window as ClarityWindow).clarity?.("consent", false);
};