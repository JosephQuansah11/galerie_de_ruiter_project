import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { UserProfile, UserProfileUpdate } from "@/types/types";
import type { AuthContextValue } from "./authTypes";
import { keycloak } from "./keycloakClient";
import { useAvatar } from "./useAvatar";
import { useAuthInitialization } from "./useAuthInitialization";
import { useKeycloakToken } from "./useKeycloakToken";
import { registerUser, updateCurrentUser } from "@/pages/auth/authApi";

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile>();
  const [roles, setRoles] = useState<string[]>([]);
  const { token, syncToken, refreshToken } = useKeycloakToken(setAuthenticated, setProfile, setRoles);
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
    login: () => keycloak.login({ redirectUri: `${window.location.origin}/dashboard` }),
    logout: () => keycloak.logout(), register, updateProfile,
  }), [authenticated, loading, token, profile, avatarUrl, refreshAvatar, roles]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
