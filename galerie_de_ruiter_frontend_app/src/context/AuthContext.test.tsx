import { act, render, screen } from "@testing-library/react";
import { AuthProvider, useAuth } from "./AuthContext";
import { keycloak } from "./keycloakClient";

/**
 * Signing out is two things. The app drops what it holds in memory, and Keycloak ends the session
 * and returns the browser to /logout - the one response that carries Clear-Site-Data (see
 * nginx.conf and the blueprint), which is what clears the HTTP cache, the cookies and the storage
 * the app cannot reach itself. Pointing that redirect anywhere else would leave the data behind.
 */
function SignOut() {
  const auth = useAuth();
  return <button onClick={() => void auth.logout()}>sign out</button>;
}

describe("signing out", () => {
  it("ends the session at Keycloak and comes back through the page that clears the browser", async () => {
    render(<AuthProvider><SignOut /></AuthProvider>);

    await act(async () => { screen.getByRole("button", { name: "sign out" }).click(); });

    expect(keycloak.logout as unknown as jest.Mock)
      .toHaveBeenCalledWith({ redirectUri: `${window.location.origin}/logout` });
  });
});

/**
 * The sign-in path has one hard-won rule: the page must not ask the identity provider for the
 * session while it loads. `onLoad: "check-sso"` does exactly that, and keycloak-js answers it by
 * loading Keycloak's third-party-cookie probe (`.../3p-cookies/step1.html`) in a hidden iframe of
 * its own first. That frame is cross-origin, Keycloak serves it with no Cross-Origin-Resource-Policy
 * - which is not this site's header to add - and the browser refused it under the site's own
 * Cross-Origin-Embedder-Policy. The adapter then rejected on its ten-second timeout, so the
 * endpoints `init` discovers were never handed over and the sign-in button did nothing at all.
 */
describe("the session check on load", () => {
  it("asks through no frame at all", async () => {
    render(<AuthProvider><SignOut /></AuthProvider>);
    await act(async () => { await Promise.resolve(); });

    const options = (keycloak.init as unknown as jest.Mock).mock.calls[0][0] as Record<string, unknown>;
    expect(options.onLoad).toBeUndefined();
    expect(options.silentCheckSsoRedirectUri).toBeUndefined();
    // The session status is not polled either, which is the adapter's other iframe.
    expect(options.checkLoginIframe).toBe(false);
  });
});
