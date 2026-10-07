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
  login: () => void;
  logout: () => void;
  updateProfile: (profile: UserProfileUpdate) => Promise<void>;
  register: (profile: UserProfile & { password: string }) => Promise<void>;
}
