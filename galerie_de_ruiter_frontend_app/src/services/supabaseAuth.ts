/**
 * Where the project lives and the key the browser may hold. A function replaces it rather than the
 * constants being read directly, so a test can point the client at a project - and so a runtime
 * configuration would have somewhere to land later.
 */
let config = {
  url: (import.meta.env.VITE_SUPABASE_URL ?? "").trim().replace(/\/$/, ""),
  key: import.meta.env.VITE_SUPABASE_ANON_KEY ?? "",
};

/** Points the client at a project. The app never calls this; the tests do. */
export const configureSupabase = (next: { url: string; key: string }): void => {
  config = { url: next.url.trim().replace(/\/$/, ""), key: next.key };
};
/**
 * Signing in, against Supabase Auth rather than Keycloak.
 *
 * The gallery's accounts are named by people, not by email addresses: the sign-in form takes
 * `de-ruiter` and this turns it into `de-ruiter@galerie-de-ruiter.be`, which is the address
 * Supabase actually keys an account by. An address typed in full is passed through untouched, so an
 * account registered with a real one still works.
 *
 * Nothing here is a secret. The anonymous key is published to the browser by design and only ever
 * exchanges credentials for a token; the API verifies what comes back with Supabase's public keys.
 */

/** The domain the gallery's own accounts live under, so a bare username is enough to sign in. */
export const GALLERY_EMAIL_DOMAIN = "galerie-de-ruiter.be";

/** Whether a Supabase project is configured at all; without one, the pages say so instead of failing. */
export const isSupabaseConfigured = (): boolean => config.url.length > 0 && config.key.length > 0;

/** A signed-in session, in the shape the rest of the app already understands. */
export type SupabaseSession = {
  accessToken: string;
  refreshToken: string;
  /** Epoch milliseconds, so it can be compared with Date.now() without a library. */
  expiresAt: number;
  userId: string;
  email?: string;
};

/** What Supabase answered, before it is interpreted. */
type TokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  user?: { id?: string; email?: string };
  error?: string;
  error_code?: string;
  message?: string;
  msg?: string;
};

const toSession = (body: TokenResponse): SupabaseSession => {
  if (!body.access_token || !body.refresh_token || !body.user?.id) {
    throw new Error(body.error_code ?? body.error ?? body.message ?? body.msg ?? "signInFailed");
  }
  return {
    accessToken: body.access_token,
    refreshToken: body.refresh_token,
    expiresAt: Date.now() + (body.expires_in ?? 3600) * 1000,
    userId: body.user.id,
    email: body.user.email,
  };
};

/** A username as typed, or an address as typed, becomes the address Supabase files the account under. */
export const toEmail = (usernameOrEmail: string): string => {
  const value = usernameOrEmail.trim();
  if (!value) return "";
  if (value.includes("@")) return value.toLowerCase();
  return `${value.toLowerCase()}@${GALLERY_EMAIL_DOMAIN}`;
};

async function post(path: string, body: unknown, accessToken?: string): Promise<TokenResponse> {
  if (!isSupabaseConfigured()) {
    // Nothing to call: the build had no project URL. Saying so beats a network error that looks
    // like a wrong password.
    throw new Error("authNotConfigured");
  }
  const response = await fetch(`${config.url}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: config.key,
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const json = (await response.json().catch(() => ({}))) as TokenResponse;
  if (!response.ok) {
    const code = json.error_code ?? json.error ?? json.message ?? json.msg ?? `http${response.status}`;
    // Logged as well as thrown: the message on screen is translated, and the code is what says why.
    console.warn("supabase auth refused", response.status, code, json);
    throw new Error(code);
  }
  return json;
}

/** Exchanges a username and password for a session. Throws an Error whose message is a translation key. */
export async function signIn(usernameOrEmail: string, password: string): Promise<SupabaseSession> {
  const body = await post("/auth/v1/token?grant_type=password", {
    email: toEmail(usernameOrEmail),
    password,
  });
  return toSession(body);
}

/**
 * Registers an account and returns its session when the project confirms addresses by email.
 * When confirmation is required the response carries no session, and the caller shows the
 * "check your inbox" message instead.
 */
export async function signUp(usernameOrEmail: string, password: string): Promise<SupabaseSession | null> {
  const body = await post("/auth/v1/signup", { email: toEmail(usernameOrEmail), password });
  return body.access_token ? toSession(body) : null;
}

/** A fresh access token, from the refresh token a session already holds. */
export async function refresh(session: SupabaseSession): Promise<SupabaseSession> {
  const body = await post("/auth/v1/token?grant_type=refresh_token", {
    refresh_token: session.refreshToken,
  });
  return toSession(body);
}

/** Ends the session server-side. Failure is not worth surfacing: the local session goes either way. */
export async function signOut(session: SupabaseSession): Promise<void> {
  try {
    await post("/auth/v1/logout", {}, session.accessToken);
  } catch {
    // A revoked or expired token is already signed out; the caller clears its own state regardless.
  }
}

/**
 * Sets a new password for the signed-in account.
 *
 * The identity provider owns this, not the gallery: it holds the password and knows how to store it,
 * and the profile row never sees one. The access token is the proof that the person asking is the
 * account being changed, which is why the current password is not needed here - but the form asks
 * for it anyway, because someone who left a browser signed in should not be able to lock its owner
 * out.
 *
 * Throws an Error whose message is a code ("weak_password", "same_password", "http401").
 */
export async function updatePassword(session: SupabaseSession, password: string): Promise<void> {
  if (!isSupabaseConfigured()) throw new Error("authNotConfigured");
  const response = await fetch(`${config.url}/auth/v1/user`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      apikey: config.key,
      Authorization: `Bearer ${session.accessToken}`,
    },
    body: JSON.stringify({ password }),
  });
  if (response.ok) return;
  const json = (await response.json().catch(() => ({}))) as TokenResponse;
  const code = json.error_code ?? json.error ?? json.msg ?? json.message ?? `http${response.status}`;
  console.warn("supabase password change refused", response.status, code, json);
  throw new Error(code);
}
