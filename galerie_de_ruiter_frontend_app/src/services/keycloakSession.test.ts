import { clearKeycloakSession, readKeycloakSession, writeKeycloakSession } from "./keycloakSession";

/**
 * The stored session is what keeps a signed-in visitor signed in across a page load: keycloak-js
 * keeps its tokens in memory, so without this a reload hands them the visitor's version of the site
 * again. These tests are about the two ends that matter - a session that comes back, and a session
 * that is gone for good once the visitor signs out.
 */
describe("the stored keycloak session", () => {
  it("keeps the tokens a page load needs to start signed in", () => {
    writeKeycloakSession({ token: "access", refreshToken: "refresh", idToken: "identity" });

    expect(readKeycloakSession()).toEqual({ token: "access", refreshToken: "refresh", idToken: "identity" });
  });

  it("copes with a session that carries no identity token", () => {
    writeKeycloakSession({ token: "access", refreshToken: "refresh" });

    expect(readKeycloakSession()).toEqual({ token: "access", refreshToken: "refresh", idToken: undefined });
  });

  it("ignores anything malformed rather than starting a session from it", () => {
    // Half a session is no session: the adapter only seeds from one that has both tokens.
    localStorage.setItem("galerie-keycloak-session", "not json at all");
    expect(readKeycloakSession()).toBeUndefined();

    localStorage.setItem("galerie-keycloak-session", JSON.stringify({ token: "access" }));
    expect(readKeycloakSession()).toBeUndefined();

    localStorage.setItem("galerie-keycloak-session", JSON.stringify({ refreshToken: "refresh" }));
    expect(readKeycloakSession()).toBeUndefined();
  });

  it("forgets the session when it is cleared", () => {
    writeKeycloakSession({ token: "access", refreshToken: "refresh" });

    clearKeycloakSession();

    expect(readKeycloakSession()).toBeUndefined();
  });
});
