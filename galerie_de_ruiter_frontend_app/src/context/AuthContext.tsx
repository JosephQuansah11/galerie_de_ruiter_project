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
  url: import.meta.env.VITE_KEYCLOAK_URL ?? "http://localhost:8081",
  realm: import.meta.env.VITE_KEYCLOAK_REALM ?? "movie_project_keycloak",
  clientId:
    import.meta.env.VITE_KEYCLOAK_CLIENT_ID ?? "movie_project_frontend_client",
});

export function AuthProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [token, setToken] = useState<string>();
  const [profile, setProfile] = useState<UserProfile>();
  const [roles, setRoles] = useState<string[]>([]);
  const initialized = useRef(false);

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
        setToken(keycloak.token);
        setAuthToken(keycloak.token);
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
          setProfile({
            username: tokenData?.preferred_username ?? "Member",
            email: tokenData?.email,
          });
          if (keycloak.token)
            syncCurrentUser(keycloak.token)
              .then(setProfile)
              .catch(() => undefined);
        }
      })
      .catch(() => setAuthenticated(false))
      .finally(() => setLoading(false));
  }, []);

  keycloak.onAuthRefreshSuccess = () => {
  setToken(keycloak.token);
  setAuthToken(keycloak.token);
};

keycloak.onAuthLogout = () => {
  setToken(undefined);
  setAuthToken(undefined);
};

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
      isAdmin: roles.some((role) => role.toUpperCase() === "ADMIN"),
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
