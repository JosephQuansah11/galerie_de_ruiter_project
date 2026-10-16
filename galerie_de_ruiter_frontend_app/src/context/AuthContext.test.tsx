import { act, render, screen } from "@testing-library/react";
import { AuthProvider, useAuth } from "./AuthContext";
import { keycloak } from "./keycloakClient";
import { readKeycloakSession, writeKeycloakSession } from "@/services/keycloakSession";
import { syncCurrentUser } from "@/pages/auth/authApi";

/**
 * The API refuses `GET /api/me` with 403 to a token that carries none of the roles it accepts, and
 * the realm hands a role to nobody on its own (see the README). The app asks on every page load, so
 * the rule is worth pinning: it must not ask when the only possible answer is a refusal.
 */
jest.mock("@/pages/auth/authApi", () => ({
  syncCurrentUser: jest.fn().mockResolvedValue({ username: "member" }),
  updateCurrentUser: jest.fn(),
  registerUser: jest.fn(),
}));

/** The inert Keycloak double, with the parts a stored session needs made reachable. */
const double = keycloak as unknown as {
  token?: string; refreshToken?: string; idToken?: string; tokenParsed?: unknown;
};

afterEach(() => {
  double.token = undefined;
  double.refreshToken = undefined;
  double.idToken = undefined;
  double.tokenParsed = undefined;
});

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

  it("leaves nothing of the session in the browser", async () => {
    writeKeycloakSession({ token: "access", refreshToken: "refresh" });
    render(<AuthProvider><SignOut /></AuthProvider>);

    await act(async () => { screen.getByRole("button", { name: "sign out" }).click(); });

    expect(readKeycloakSession()).toBeUndefined();
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

/**
 * A stored session is the other half of that rule. The page still asks nobody for a session, but it
 * does start from the tokens the last page left behind, and the adapter refreshes them before `init`
 * answers - so a reload and a new tab are the same signed-in visitor rather than a visitor again.
 */
describe("the session on a fresh page load", () => {
  it("hands the stored session back to the adapter", async () => {
    writeKeycloakSession({ token: "access", refreshToken: "refresh" });

    render(<AuthProvider><SignOut /></AuthProvider>);
    await act(async () => { await Promise.resolve(); });

    const options = (keycloak.init as unknown as jest.Mock).mock.calls[0][0] as Record<string, unknown>;
    expect(options.token).toBe("access");
    expect(options.refreshToken).toBe("refresh");
  });

  it("writes the session it was handed, so the next load has one", async () => {
    (keycloak.init as unknown as jest.Mock).mockResolvedValueOnce(true);
    double.token = "access";
    double.refreshToken = "rotated";

    render(<AuthProvider><SignOut /></AuthProvider>);
    await act(async () => { await Promise.resolve(); });

    expect(readKeycloakSession()).toEqual({ token: "access", refreshToken: "rotated", idToken: undefined });
  });

  it("forgets a session Keycloak refused to refresh", async () => {
    writeKeycloakSession({ token: "access", refreshToken: "stale" });
    (keycloak.init as unknown as jest.Mock).mockRejectedValueOnce(new Error("refresh refused"));

    render(<AuthProvider><SignOut /></AuthProvider>);
    await act(async () => { await Promise.resolve(); });

    // Otherwise every page load would present the same dead session and fail the same way.
    expect(readKeycloakSession()).toBeUndefined();
  });
});

describe("asking the API who the visitor is", () => {
  /** A signed-in page load whose token carries exactly these realm roles. */
  const signedInWith = (roles: string[]) => {
    (keycloak.init as unknown as jest.Mock).mockResolvedValueOnce(true);
    double.token = "access";
    double.tokenParsed = { preferred_username: "joseph", realm_access: { roles } };
  };

  it("asks when the token carries a role the endpoint accepts", async () => {
    signedInWith(["USER"]);

    render(<AuthProvider><SignOut /></AuthProvider>);
    await act(async () => { await Promise.resolve(); });

    expect(syncCurrentUser).toHaveBeenCalledWith("access");
  });

  it("does not ask when it carries none, because the only answer would be a refusal", async () => {
    signedInWith([]);

    render(<AuthProvider><SignOut /></AuthProvider>);
    await act(async () => { await Promise.resolve(); });

    // A 403 the app already knows it will get is not worth a request, and the browser reports the
    // failed call in the console where the gallery reads it as something being broken.
    expect(syncCurrentUser).not.toHaveBeenCalled();
  });
});
