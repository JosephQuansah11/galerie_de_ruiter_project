import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import type { UserProfile } from "@/types/types";
import { setAuthToken } from "@/apis/authPromise";
import { keycloak } from "./keycloakClient";

export function useKeycloakToken(setAuthenticated: Dispatch<SetStateAction<boolean>>,
  setProfile: Dispatch<SetStateAction<UserProfile | undefined>>, setRoles: Dispatch<SetStateAction<string[]>>) {
  const [token, setToken] = useState<string>();
  const refreshing = useRef<Promise<boolean> | undefined>(undefined);
  const syncToken = useCallback((next?: string) => { setToken(next); setAuthToken(next); }, []);
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
    keycloak.onAuthRefreshSuccess = () => syncToken(keycloak.token);
    keycloak.onAuthLogout = () => { setAuthenticated(false); setProfile(undefined); setRoles([]); syncToken(undefined); };
    keycloak.onTokenExpired = () => { void refreshToken(true); };
    return () => { keycloak.onAuthRefreshSuccess = undefined; keycloak.onAuthLogout = undefined; keycloak.onTokenExpired = undefined; };
  }, [refreshToken, setAuthenticated, setProfile, setRoles, syncToken]);
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
  return { token, syncToken, refreshToken };
}
