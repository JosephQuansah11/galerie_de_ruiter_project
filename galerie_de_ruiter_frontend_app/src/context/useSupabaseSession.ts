import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import type { UserProfile } from "@/types/types";
import { refresh, signOut, type SupabaseSession } from "@/services/supabaseAuth";

/**
 * The signed-in session, kept across page loads and tabs.
 *
 * This replaces the Keycloak adapter and keeps that adapter's contract (`token`, and a way to
 * publish a new one) on purpose: AuthContext consumes exactly those, so every component that reads
 * a token - the profile, the admin screens, the concierge - goes on working unchanged.
 *
 * The session lives in localStorage because that is what a browser has: no third-party cookie, no
 * iframe, no redirect. A token close to expiry is refreshed before use, and the rotated refresh
 * token is written back, so a tab left open overnight is still signed in in the morning.
 */
const STORAGE_KEY = "galerie.session";

/** Refresh this long before expiry, so a request never races the clock. */
const EARLY_MS = 60_000;

/** Reads a stored session, discarding anything not shaped like one. */
export function readSession(): SupabaseSession | undefined {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as Partial<SupabaseSession>;
    if (!parsed.accessToken || !parsed.refreshToken || !parsed.userId) return undefined;
    return {
      accessToken: parsed.accessToken,
      refreshToken: parsed.refreshToken,
      expiresAt: Number(parsed.expiresAt ?? 0),
      userId: parsed.userId,
      email: parsed.email,
    };
  } catch {
    return undefined;
  }
}

export function writeSession(session: SupabaseSession): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Storage can be full or refused; the session still works for this page load.
  }
}

export function clearSession(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // A store that cannot be read cannot be cleared either; nothing to do.
  }
}

/** The claims inside a token, or undefined when it cannot be read. Never throws. */
export function claimsOf(token?: string): Record<string, unknown> | undefined {
  const payload = token?.split(".")[1];
  if (!payload) return undefined;
  try {
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    return JSON.parse(window.atob(padded)) as Record<string, unknown>;
  } catch {
    return undefined;
  }
}

/** The roles a token carries, from app_metadata - never user_metadata, which its owner can write. */
export function rolesOf(claims: Record<string, unknown> | undefined): string[] {
  const appMetadata = (claims?.app_metadata ?? {}) as Record<string, unknown>;
  const roles = appMetadata.roles;
  return Array.isArray(roles) ? roles.filter((role): role is string => typeof role === "string") : [];
}

/** The visitor as the app already describes one, from what the token carries. */
export function profileFromClaims(claims: Record<string, unknown> | undefined): Partial<UserProfile> {
  const metadata = (claims?.user_metadata ?? {}) as Record<string, unknown>;
  const email = typeof claims?.email === "string" ? claims.email : undefined;
  const named = (value: unknown): string | undefined => (typeof value === "string" && value ? value : undefined);
  return {
    username: named(metadata.username) ?? named(metadata.full_name) ?? email?.split("@")[0],
    email,
    firstName: named(metadata.first_name) ?? named(metadata.given_name),
    lastName: named(metadata.last_name) ?? named(metadata.family_name),
  };
}

type Setters = {
  setAuthenticated: Dispatch<SetStateAction<boolean>>;
  setProfile: Dispatch<SetStateAction<UserProfile | undefined>>;
  setRoles: Dispatch<SetStateAction<string[]>>;
};

export function useSupabaseSession({ setAuthenticated, setProfile, setRoles }: Setters) {
  const [session, setSession] = useState<SupabaseSession | undefined>(() => readSession());
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  /** Publishes a session to the store and to the app's state. */
  const adopt = useCallback((next: SupabaseSession) => {
    writeSession(next);
    setSession(next);
    setAuthenticated(true);
    const claims = claimsOf(next.accessToken);
    setRoles(rolesOf(claims));
    setProfile((current) => ({ ...current, ...profileFromClaims(claims) }) as UserProfile);
  }, [setAuthenticated, setProfile, setRoles]);

  const forget = useCallback(() => {
    clearSession();
    setSession(undefined);
    setAuthenticated(false);
    setProfile(undefined);
    setRoles([]);
  }, [setAuthenticated, setProfile, setRoles]);

  /** Signs out server-side too, so a copied refresh token stops working. */
  const endSession = useCallback(async () => {
    const current = session;
    forget();
    if (current) await signOut(current);
  }, [forget, session]);

  // A stored session is adopted on load, and refreshed when it is close to expiry.
  useEffect(() => {
    const stored = readSession();
    if (!stored) return;
    adopt(stored);
    if (stored.expiresAt - EARLY_MS > Date.now()) return;
    refresh(stored).then(adopt).catch(forget);
    // Once only: adopt and forget are stable, and re-running would fight the timer below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keeps a long-lived tab signed in without asking the visitor anything.
  useEffect(() => {
    if (!session) return;
    const delay = Math.max(5_000, session.expiresAt - EARLY_MS - Date.now());
    timer.current = setTimeout(() => {
      refresh(session).then(adopt).catch(forget);
    }, delay);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [session, adopt, forget]);

  return { session, token: session?.accessToken, adopt, endSession, forget };
}
