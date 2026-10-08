/**
 * Environment values for the Jest run.
 *
 * Webpack injects these at build time; here they are set before any module loads so
 * `apis/apiConfig.ts` resolves an absolute API origin instead of the localhost fallback.
 */
process.env.NODE_ENV = "test";
process.env.VITE_JAVA_API_URL = "http://api.test";
process.env.VITE_JAVA_BACKEND_URL = "http://api.test";
process.env.VITE_API_URL = "http://api.test";
process.env.VITE_PYTHON_API_URL = "http://python.test";
process.env.VITE_RECONSTRUCTION_API_URL = "http://python.test";
process.env.VITE_KEYCLOAK_URL = "http://keycloak.test";
process.env.VITE_KEYCLOAK_REALM = "test-realm";
process.env.VITE_KEYCLOAK_CLIENT_ID = "test-client";
process.env.VITE_REACT_APP_URL = "http://app.test";

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

  window.scrollTo = () => undefined;
  Element.prototype.scrollIntoView = Element.prototype.scrollIntoView ?? (() => undefined);
  window.HTMLElement.prototype.scrollIntoView = window.HTMLElement.prototype.scrollIntoView ?? (() => undefined);
}
