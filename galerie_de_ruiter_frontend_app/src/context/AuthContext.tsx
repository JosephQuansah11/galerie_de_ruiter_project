import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import type { Registration, UserProfile, UserProfileUpdate } from "@/types/types";
import type { AuthContextValue } from "./authTypes";
import { useAvatar } from "./useAvatar";
import { useAuthInitialization } from "./useAuthInitialization";
import { useSupabaseSession, claimsOf } from "./useSupabaseSession";
import { syncCurrentUser, updateCurrentUser } from "@/pages/auth/authApi";
import { changePassword as changePasswordWithSupabase, signIn as signInWithSupabase, signUp } from "@/services/supabaseAuth";
import { clearChatSession } from "@/services/chatSession";
import { clearCache } from "@/services/apiCache";
import { clearCsrfTokenCache } from "@/apis/client";
import { setUnauthorizedHandler } from "@/apis/authPromise";

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Sends the visitor to the sign-in page, carrying the page they asked for.
 *
 * `login` keeps this name and this job because a dozen components already call it - they simply
 * arrive at a form now instead of leaving the site for the identity provider. The move is a route
 * change, not a document load: a full reload threw away every fetched picture and the whole
 * JavaScript bundle to show one form, which is what made moving around feel like a refresh.
 */
const toSignIn = (navigate: (path: string) => void, from?: string) =>
  navigate(from ? `/login?from=${encodeURIComponent(from)}` : "/login");

export function AuthProvider({ children }: Readonly<{ children: ReactNode }>) {
  const navigate = useNavigate();
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile>();
  const [roles, setRoles] = useState<string[]>([]);
  const { token, adopt, endSession, forget } = useSupabaseSession({ setAuthenticated, setProfile, setRoles });
  const { avatarUrl, refreshAvatar } = useAvatar(authenticated, token);
  useAuthInitialization({ setLoading });
  /**
   * Reads the profile row when a page actually needs it. The account menu and the profile form are
   * already named by the token, so this is only for the details that live in the gallery's own row
   * (and for picking up a name edited on another device). It is called by the profile page, not on
   * every page load.
   */
  const refreshProfile = useCallback(async () => {
    if (!token) return;
    try {
      const user = await syncCurrentUser(token);
      setProfile((current) => ({ ...user,
        firstName: user.firstName ?? current?.firstName,
        lastName: user.lastName ?? current?.lastName,
        username: user.username || current?.username || "" }));
    } catch {
      // The token already names the visitor; the profile form can still be saved.
    }
  }, [token]);
  // A token the API refuses is no longer usable: forget it, drop cached responses, and let the
  // authPromise interceptor retry the public request without it. Otherwise every public page keeps
  // presenting the same refused token and both the collection and its categories stay empty.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearCache();
      clearCsrfTokenCache();
      forget();
    });
    return () => setUnauthorizedHandler(undefined);
  }, [forget]);
  /** Signs in where the visitor stands: no navigation, so the form can show an error instead. */
  const signIn = async (usernameOrEmail: string, password: string) => {
    clearCsrfTokenCache();
    adopt(await signInWithSupabase(usernameOrEmail, password));
  };
  const register = async (registration: Registration) => {
    clearCsrfTokenCache();
    const session = await signUp(registration);
    // A project that confirms addresses by email returns no session: the caller shows "check your
    // inbox" and the visitor signs in once they have.
    if (!session) return false;
    adopt(session);
    return true;
  };
  const updateProfile = async (details: UserProfileUpdate) => {
    if (!token) throw new Error("A signed-in user is required to update profile details.");
    setProfile(await updateCurrentUser(token, details));
  };
  /**
   * Changes the password of the account this session belongs to.
   *
   * The address is read from the access token, not from `profile.email`: the profile screen edits
   * the gallery's own copy of the address, which may differ from the one Supabase files the account
   * under, and proving the current password with the wrong address would look like a wrong password.
   */
  const changePassword = async (currentPassword: string, newPassword: string) => {
    const email = claimsOf(token)?.email;
    if (typeof email !== "string" || !email) throw new Error("authEmailMissing");
    adopt(await changePasswordWithSupabase(email, currentPassword, newPassword));
  };
  const value = useMemo(() => ({
    authenticated, loading, token, profile, avatarUrl, refreshAvatar, refreshProfile, roles,
    isAdmin: roles.some((role) => role.replace(/^ROLE_/i, "").toUpperCase() === "ADMIN"),
    login: (from?: string) => toSignIn(navigate, from),
    // Signing out ends the concierge conversation, drops the cached public data and forgets the
    // stored session, so the next person to use the browser starts from a clean slate. Keycloak
    // then returns the browser to /logout, the one response that carries Clear-Site-Data (see
    // nginx.conf and the blueprint): that is what clears the parts this app cannot reach - the HTTP
    // cache, the cookies and the storage it does not own.
    logout: () => {
      clearChatSession();
      clearCache();
      clearCsrfTokenCache();
      return endSession();
    },
    signIn, register, updateProfile, changePassword,
  }), [authenticated, loading, token, profile, avatarUrl, refreshAvatar, refreshProfile, roles]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
