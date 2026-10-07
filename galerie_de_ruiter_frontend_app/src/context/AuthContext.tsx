import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Keycloak from "keycloak-js";
import type { UserProfile } from "../types/types";
import { registerUser, syncCurrentUser } from "../pages/auth/authApi";
import { setAuthToken } from "../apis/authPromise";
import { useTranslation } from "react-i18next";

interface AuthContextValue {
  authenticated: boolean;
  loading: boolean;
  token?: string;
  profile?: UserProfile;
  roles: string[];
  isAdmin: boolean;
  login: () => void;
  logout: () => void;
  register: (profile: UserProfile & { password: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const keycloak = new Keycloak({
  url: import.meta.env.VITE_KEYCLOAK_URL ?? "http://localhost:8082",
  realm: import.meta.env.VITE_KEYCLOAK_REALM ?? "movie_project_keycloak",
  clientId:
    import.meta.env.VITE_KEYCLOAK_CLIENT_ID ?? "movie_project_frontend_client",
});

export function AuthProvider({ children }: Readonly<{ children: ReactNode }>) {
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [token, setToken] = useState<string>();
  const [profile, setProfile] = useState<UserProfile>();
  const [roles, setRoles] = useState<string[]>([]);
  const initialized = useRef(false);
  const fallbackUsername = useRef(false);
  const refreshInProgress = useRef<Promise<boolean> | undefined>(undefined);

  useEffect(() => {
    if (fallbackUsername.current) {
      setProfile((current) =>
        current ? { ...current, username: t("member") } : current,
      );
    }
  }, [i18n.language, t]);

  const syncToken = useCallback((nextToken?: string) => {
    setToken(nextToken);
    setAuthToken(nextToken);
  }, []);

  const refreshToken = useCallback(async (force = false) => {
    if (!keycloak.authenticated) return false;
    if (refreshInProgress.current) return refreshInProgress.current;

    const refresh = keycloak
      .updateToken(force ? -1 : 60)
      .then((refreshed) => {
        syncToken(keycloak.token);
        return refreshed;
      })
      .catch(() => {
        keycloak.clearToken();
        setAuthenticated(false);
        setProfile(undefined);
        setRoles([]);
        syncToken(undefined);
        return false;
      })
      .finally(() => {
        refreshInProgress.current = undefined;
      });

    refreshInProgress.current = refresh;
    return refresh;
  }, [syncToken]);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    keycloak
      .init({
        onLoad: "check-sso",
        pkceMethod: "S256",
        checkLoginIframe: false,
        redirectUri: `${window.location.origin}/dashboard`,
      })
      .then((isAuthenticated) => {
        setAuthenticated(isAuthenticated);
        syncToken(keycloak.token);
        if (isAuthenticated) {
          const tokenData = keycloak.tokenParsed as
            | {
                preferred_username?: string;
                email?: string;
                realm_access?: { roles?: string[] };
                resource_access?: Record<string, { roles?: string[] }>;
              }
            | undefined;
          const clientRoles = Object.values(
            tokenData?.resource_access ?? {},
          ).flatMap((resource) => resource.roles ?? []);
          setRoles([
            ...new Set([
              ...(tokenData?.realm_access?.roles ?? []),
              ...clientRoles,
            ]),
          ]);
          fallbackUsername.current = !tokenData?.preferred_username;
          setProfile({
            username: tokenData?.preferred_username ?? t("member"),
            email: tokenData?.email,
          });
          if (keycloak.token)
            syncCurrentUser(keycloak.token)
              .then((syncedProfile) => {
                fallbackUsername.current = !syncedProfile.username;
                setProfile({
                  ...syncedProfile,
                  username: syncedProfile.username || i18n.t("member"),
                });
              })
              .catch(() => undefined);
        }
      })
      .catch(() => setAuthenticated(false))
      .finally(() => setLoading(false));
  }, [syncToken, t]);

  useEffect(() => {
    keycloak.onAuthRefreshSuccess = () => syncToken(keycloak.token);
    keycloak.onAuthLogout = () => {
      setAuthenticated(false);
      setProfile(undefined);
      setRoles([]);
      syncToken(undefined);
    };
    keycloak.onTokenExpired = () => {
      void refreshToken(true);
    };

    return () => {
      keycloak.onAuthRefreshSuccess = undefined;
      keycloak.onAuthLogout = undefined;
      keycloak.onTokenExpired = undefined;
    };
  }, [refreshToken, syncToken]);

  useEffect(() => {
    if (!authenticated) return;

    const refreshEveryThirtyMinutes = window.setInterval(
      () => void refreshToken(true),
      30 * 60 * 1000,
    );
    const refreshWhenReturning = () => {
      if (document.visibilityState === "visible") void refreshToken();
    };

    document.addEventListener("visibilitychange", refreshWhenReturning);
    window.addEventListener("focus", refreshWhenReturning);

    return () => {
      window.clearInterval(refreshEveryThirtyMinutes);
      document.removeEventListener("visibilitychange", refreshWhenReturning);
      window.removeEventListener("focus", refreshWhenReturning);
    };
  }, [authenticated, refreshToken]);

  const register = useCallback(
    async (registration: UserProfile & { password: string }) => {
      await registerUser(registration);
      await keycloak.login({ loginHint: registration.username });
    },
    [],
  );

  const value = useMemo(
    () => ({
      authenticated,
      loading,
      token,
      profile,
      roles,
      isAdmin: roles.some(
        (role) => role.replace(/^ROLE_/i, "").toUpperCase() === "ADMIN",
      ),
      login: () => keycloak.login({ redirectUri: `${window.location.origin}/dashboard` }),
      logout: () => keycloak.logout(),
      register,
    }),
    [authenticated, loading, token, profile, roles, register],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
