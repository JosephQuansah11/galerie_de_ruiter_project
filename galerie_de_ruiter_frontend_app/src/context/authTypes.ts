import type { Registration, UserProfile, UserProfileUpdate } from "@/types/types";

export interface AuthContextValue {
  authenticated: boolean;
  loading: boolean;
  token?: string;
  avatarUrl?: string;
  refreshAvatar: () => Promise<void>;
  /** Reads the gallery's own profile row; the profile page calls it when it opens. */
  refreshProfile: () => Promise<void>;
  profile?: UserProfile;
  roles: string[];
  isAdmin: boolean;
  /** Sends the visitor to the sign-in page, remembering where they were going. */
  login: (from?: string) => void;
  /** Signs in with a username (or an address) and a password, in place, without leaving the page. */
  signIn: (usernameOrEmail: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (profile: UserProfileUpdate) => Promise<void>;
  /**
   * Creates an account under a real address. Resolves true when the project signed the visitor in
   * straight away, and false when it sent a confirmation link instead.
   */
  register: (registration: Registration) => Promise<boolean>;
  /**
   * Changes the signed-in account's password after checking the current one. The check costs a
   * password grant, and it is what stops someone at an unlocked browser from locking the owner out.
   */
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}
