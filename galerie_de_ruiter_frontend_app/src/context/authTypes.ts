import type { UserProfile, UserProfileUpdate } from "@/types/types";

export interface AuthContextValue {
  authenticated: boolean;
  loading: boolean;
  token?: string;
  avatarUrl?: string;
  refreshAvatar: () => Promise<void>;
  profile?: UserProfile;
  roles: string[];
  isAdmin: boolean;
  login: (from?: string) => void;
  /** The same sign-in with Google named as the provider, so Keycloak does not show its own page. */
  loginWithGoogle: (from?: string) => void;
  logout: () => void;
  updateProfile: (profile: UserProfileUpdate) => Promise<void>;
  register: (profile: UserProfile & { password: string }) => Promise<void>;
}
