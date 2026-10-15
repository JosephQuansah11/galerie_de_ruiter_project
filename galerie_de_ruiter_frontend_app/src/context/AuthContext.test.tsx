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
