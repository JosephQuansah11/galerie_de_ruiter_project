/**
 * The signed-in session, kept across page loads.
 *
 * keycloak-js holds its tokens in memory only: `init` accepts a token to start from, but the
 * adapter ships no store of its own. So a page load used to end the session, and a signed-in
 * visitor was handed the visitor's version of the site - a collection that stops at its first page,
 * account pages that bounce to the sign-in screen - until they clicked Inloggen again.
 *
 * The tokens are written here instead, and `useAuthInitialization` hands them back to `init`, which
 * refreshes the access token before it answers (the adapter's own `updateToken(-1)`, which is what
 * makes an expired access token harmless). `localStorage` is the browser-wide choice on purpose: a
 * new tab is the same person. Everything here is removed on sign-out, by `clearKeycloakSession` and
 * by the Clear-Site-Data header on /logout, which clears the whole store.
 *
 * What it costs: a refresh token sits in the browser for as long as the session lasts, so anything
 * that can run script on this origin could read it. The site ships no inline script and sends
 * `script-src 'self'` (see "Security headers" in the README), which is what keeps that surface
 * small, and a refresh token that has been rotated or revoked is worth nothing to whoever read it.
 */
const STORAGE_KEY = "galerie-keycloak-session";

export type StoredSession = { token: string; refreshToken: string; idToken?: string };

function storage(): Storage | undefined {
  try {
    return typeof localStorage === "undefined" ? undefined : localStorage;
  } catch {
    // Storage can be blocked outright. The session then simply does not survive a page load.
    return undefined;
  }
}

/** Reads the stored session, ignoring anything malformed. */
export function readKeycloakSession(): StoredSession | undefined {
  const raw = storage()?.getItem(STORAGE_KEY);
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw) as Partial<StoredSession>;
    // The adapter only seeds from a session that has both, so half a session is no session.
    if (typeof parsed.token !== "string" || typeof parsed.refreshToken !== "string") return undefined;
    return {
      token: parsed.token,
      refreshToken: parsed.refreshToken,
      idToken: typeof parsed.idToken === "string" ? parsed.idToken : undefined,
    };
  } catch {
    return undefined;
  }
}

/** Writes the session the adapter is holding, so the next page load starts signed in. */
export function writeKeycloakSession(session: StoredSession): void {
  try {
    storage()?.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // A full or disabled storage must never break signing in.
  }
}

/** Ends the stored session: on sign-out, and when Keycloak refuses to refresh it. */
export function clearKeycloakSession(): void {
  try {
    storage()?.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage failures.
  }
}
