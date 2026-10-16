/**
 * Environment values for the Jest run.
 *
 * Webpack injects these at build time; here they are set before any module loads so
 * `apis/apiConfig.ts` resolves an absolute API origin instead of the localhost fallback.
 */
process.env.NODE_ENV = "test";
// The gallery's public origin, which the canonical URL is built from (src/hooks/usePageMeta.ts).
// It is deliberately not the jsdom origin: a test that expects the canonical to follow the host
// would pass while the deployed site let Render's own domain declare itself canonical.
process.env.SITE_URL = "https://galeriederuiter.cloud-ip.cc";
process.env.VITE_JAVA_API_URL = "http://api.test";
process.env.VITE_JAVA_BACKEND_URL = "http://api.test";
process.env.VITE_API_URL = "http://api.test";
process.env.VITE_KEYCLOAK_URL = "http://keycloak.test";
process.env.VITE_KEYCLOAK_REALM = "test-realm";
process.env.VITE_KEYCLOAK_CLIENT_ID = "test-client";
process.env.VITE_REACT_APP_URL = "http://app.test";
// The gallery maps through Google now (src/services/googleMaps.ts). A key is set here so the
// location page renders its frame in tests; the tests that cover the keyless build clear it.
process.env.VITE_GOOGLE_MAPS_API_KEY = "test-maps-key";

/* jsdom omits a few browser APIs the application touches. */
if (typeof window !== "undefined") {
  if (typeof (globalThis as { TextEncoder?: unknown }).TextEncoder === "undefined") {
    const { TextEncoder, TextDecoder } = require("node:util") as typeof import("node:util");
    (globalThis as { TextEncoder?: unknown }).TextEncoder = TextEncoder;
    (globalThis as { TextDecoder?: unknown }).TextDecoder = TextDecoder;
  }
  if (typeof (globalThis as { structuredClone?: unknown }).structuredClone === "undefined") {
    (globalThis as { structuredClone?: unknown }).structuredClone = (value: unknown) => JSON.parse(JSON.stringify(value));
  }

  if (!window.matchMedia) {
    window.matchMedia = ((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    })) as unknown as typeof window.matchMedia;
  }

  if (!URL.createObjectURL) {
    URL.createObjectURL = () => "blob:test-object-url";
  }
  if (!URL.revokeObjectURL) {
    URL.revokeObjectURL = () => undefined;
  }

  // jsdom implements no `fetch`, and the gallery now asks Google's geocoder from the browser
  // (src/services/googleMaps.ts). A stub that rejects keeps the app's own failure handling
  // exercised, and gives the tests something to spy on: without it, `jest.spyOn(globalThis,
  // "fetch")` throws before the test body runs.
  if (typeof globalThis.fetch === "undefined") {
    globalThis.fetch = (() => Promise.reject(new Error("fetch is not stubbed in this test"))) as unknown as typeof fetch;
  }

  window.scrollTo = () => undefined;
  Element.prototype.scrollIntoView = Element.prototype.scrollIntoView ?? (() => undefined);
  window.HTMLElement.prototype.scrollIntoView = window.HTMLElement.prototype.scrollIntoView ?? (() => undefined);

  // The application now defaults to Belgian Dutch. The suite pins English before any
  // module loads so the assertions written against the English copy stay stable.
  window.localStorage.setItem("galerie-language", "en");
}
