import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import type { UserProfile } from "@/types/types";
import { setAuthToken, setUnauthorizedHandler } from "@/apis/authPromise";
import { clearKeycloakSession, writeKeycloakSession } from "@/services/keycloakSession";
import { keycloak } from "./keycloakClient";

export function useKeycloakToken(setAuthenticated: Dispatch<SetStateAction<boolean>>,
  setProfile: Dispatch<SetStateAction<UserProfile | undefined>>, setRoles: Dispatch<SetStateAction<string[]>>) {
  const [token, setToken] = useState<string>();
  const refreshing = useRef<Promise<boolean> | undefined>(undefined);
  const syncToken = useCallback((next?: string) => { setToken(next); setAuthToken(next); }, []);
  /**
   * The stored session has to follow the adapter: Keycloak rotates the refresh token whenever it
   * refreshes one, so the copy a page load starts from is only worth having if it is written again
   * here. See src/services/keycloakSession.ts.
   */
  const storeSession = useCallback(() => {
    if (keycloak.token && keycloak.refreshToken) {
      writeKeycloakSession({ token: keycloak.token, refreshToken: keycloak.refreshToken, idToken: keycloak.idToken });
    }
  }, []);
  const refreshToken = useCallback(async (force = false) => {
    if (!keycloak.authenticated) return false;
    if (refreshing.current) return refreshing.current;
    const task = keycloak.updateToken(force ? -1 : 60).then((updated) => {
      syncToken(keycloak.token); return updated;
    }).catch(() => {
      keycloak.clearToken(); setAuthenticated(false); setProfile(undefined); setRoles([]);
      syncToken(undefined); return false;
    }).finally(() => { refreshing.current = undefined; });
    refreshing.current = task;
    return task;
  }, [setAuthenticated, setProfile, setRoles, syncToken]);
  useEffect(() => {
    keycloak.onAuthRefreshSuccess = () => { syncToken(keycloak.token); storeSession(); };
    keycloak.onAuthLogout = () => { clearKeycloakSession(); setAuthenticated(false); setProfile(undefined); setRoles([]); syncToken(undefined); };
    keycloak.onTokenExpired = () => { void refreshToken(true); };
    // The API refused the token: it is no good to anyone now, so the app stops presenting it and
    // becomes a visitor again rather than retrying a token that will keep being refused (see the
    // interceptor in src/apis/authPromise.ts, which retries the one request without it).
    const forgetRefusedToken = () => {
      keycloak.clearToken(); clearKeycloakSession();
      setAuthenticated(false); setProfile(undefined); setRoles([]); syncToken(undefined);
    };
    setUnauthorizedHandler(forgetRefusedToken);
    return () => {
      keycloak.onAuthRefreshSuccess = undefined; keycloak.onAuthLogout = undefined; keycloak.onTokenExpired = undefined;
      setUnauthorizedHandler(undefined);
    };
  }, [refreshToken, setAuthenticated, setProfile, setRoles, syncToken, storeSession]);
  useEffect(() => {
    if (!keycloak.authenticated) return;
    const timer = window.setInterval(() => void refreshToken(true), 30 * 60 * 1000);
    const refreshOnFocus = () => { if (document.visibilityState === "visible") void refreshToken(); };
    document.addEventListener("visibilitychange", refreshOnFocus);
    window.addEventListener("focus", refreshOnFocus);
    return () => {
      window.clearInterval(timer); document.removeEventListener("visibilitychange", refreshOnFocus);
      window.removeEventListener("focus", refreshOnFocus);
    };
  }, [token, refreshToken]);
  return { token, syncToken };

}
