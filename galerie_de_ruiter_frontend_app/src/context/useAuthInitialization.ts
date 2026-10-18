import { useEffect, useRef, type Dispatch, type SetStateAction } from "react";
import type { UserProfile } from "@/types/types";
import { syncCurrentUser } from "@/pages/auth/authApi";

type Setup = { setLoading: Dispatch<SetStateAction<boolean>>;
  setProfile: Dispatch<SetStateAction<UserProfile | undefined>>; setRoles: Dispatch<SetStateAction<string[]>>;
  token?: string };
/**
 * What a page load still has to do once a session is known: read the visitor's profile.
 *
 * Keycloak put the name, the email and the roles in the token and this file used to unpack them.
 * Supabase does the same, and the session hook already publishes them, so what is left is the
 * profile row - which the API creates the first time it is asked for. It is asked for once per
 * session; a failure is not shown, because the token already said who this is and the row appears
 * on the next save if it could not be read now.
 */
export function useAuthInitialization({ setLoading, setProfile, token }: Setup) {
  const synced = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    if (synced.current === token) return;
    synced.current = token;
    syncCurrentUser(token).then((user) => setProfile((current) => ({ ...user,
      firstName: user.firstName ?? current?.firstName, lastName: user.lastName ?? current?.lastName,
      username: user.username || current?.username || "" }))).catch(() => undefined)
      .finally(() => setLoading(false));
  }, [token, setLoading, setProfile]);
}
