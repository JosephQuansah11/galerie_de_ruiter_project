import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { UserProfile, UserProfileUpdate } from "@/types/types";
import type { AuthContextValue } from "./authTypes";
import { keycloak } from "./keycloakClient";
import { useAvatar } from "./useAvatar";
import { useAuthInitialization } from "./useAuthInitialization";
import { useKeycloakToken } from "./useKeycloakToken";
import { registerUser, updateCurrentUser } from "@/pages/auth/authApi";
import { clearChatSession } from "@/services/chatSession";
import { clearCache } from "@/services/apiCache";

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/** Where a sign-in returns to: the page the visitor asked for, or the landing page. */
const returnTo = (from?: string) => `${window.location.origin}${from ?? "/home"}`;

export function AuthProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile>();
  const [roles, setRoles] = useState<string[]>([]);
  const { token, syncToken } = useKeycloakToken(setAuthenticated, setProfile, setRoles);
  const { avatarUrl, refreshAvatar } = useAvatar(authenticated, token);
  useAuthInitialization({ setAuthenticated, setLoading, setProfile, setRoles, syncToken });
  const register = async (registration: UserProfile & { password: string }) => {
    await registerUser(registration);
    await keycloak.login({ loginHint: registration.username });
  };
  const updateProfile = async (details: UserProfileUpdate) => {
    if (!token) throw new Error("A signed-in user is required to update profile details.");
    setProfile(await updateCurrentUser(token, details));
  };
  const value = useMemo(() => ({
    authenticated, loading, token, profile, avatarUrl, refreshAvatar, roles,
    isAdmin: roles.some((role) => role.replace(/^ROLE_/i, "").toUpperCase() === "ADMIN"),
    login: (from?: string) => keycloak.login({ redirectUri: returnTo(from) }),
    // Signing out ends the concierge conversation and drops the cached public data, so the next
    // person to use the browser starts from a clean slate. Keycloak then returns the browser to
    // /logout, the one response that carries Clear-Site-Data (see nginx.conf and the blueprint):
    // that is what clears the parts this app cannot reach - the HTTP cache, the cookies and the
    // storage it does not own.
    logout: () => {
      clearChatSession();
      clearCache();
      return keycloak.logout({ redirectUri: returnTo("/logout") });
    },
    register, updateProfile,
  }), [authenticated, loading, token, profile, avatarUrl, refreshAvatar, roles]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
