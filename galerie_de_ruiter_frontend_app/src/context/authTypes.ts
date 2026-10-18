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
  /** Sends the visitor to the sign-in page, remembering where they were going. */
  login: (from?: string) => void;
  /** Signs in with a username (or an address) and a password, in place, without leaving the page. */
  signIn: (usernameOrEmail: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (profile: UserProfileUpdate) => Promise<void>;
  register: (profile: UserProfile & { password: string }) => Promise<void>;
}
