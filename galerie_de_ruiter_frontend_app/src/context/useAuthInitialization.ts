import { useEffect, useRef, type Dispatch, type SetStateAction } from "react";
import { useTranslation } from "react-i18next";
import type { UserProfile } from "@/types/types";
import { syncCurrentUser } from "@/pages/auth/authApi";
import { keycloak } from "./keycloakClient";

type Setup = { setAuthenticated: Dispatch<SetStateAction<boolean>>; setLoading: Dispatch<SetStateAction<boolean>>;
  setProfile: Dispatch<SetStateAction<UserProfile | undefined>>; setRoles: Dispatch<SetStateAction<string[]>>;
  syncToken: (token?: string) => void };
export function useAuthInitialization({ setAuthenticated, setLoading, setProfile, setRoles, syncToken }: Setup) {
  const { t, i18n } = useTranslation();
  const initialized = useRef(false);
  const fallbackUsername = useRef(false);
  useEffect(() => {
    if (fallbackUsername.current) setProfile((current) => current ? { ...current, username: t("member") } : current);
  }, [i18n.language, setProfile, t]);
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    keycloak.init({ onLoad: "check-sso", pkceMethod: "S256", checkLoginIframe: false,
      redirectUri: `${window.location.origin}/dashboard` }).then((isAuthenticated) => {
      setAuthenticated(isAuthenticated); syncToken(keycloak.token);
      if (!isAuthenticated) return;
      const data = keycloak.tokenParsed as { preferred_username?: string; email?: string;
        realm_access?: { roles?: string[] }; resource_access?: Record<string, { roles?: string[] }> } | undefined;
      const roles = [...(data?.realm_access?.roles ?? []), ...Object.values(data?.resource_access ?? {}).flatMap((item) => item.roles ?? [])];
      setRoles([...new Set(roles)]); fallbackUsername.current = !data?.preferred_username;
      setProfile({ username: data?.preferred_username ?? t("member"), email: data?.email });
      if (keycloak.token) syncCurrentUser(keycloak.token).then((user) => {
        fallbackUsername.current = !user.username;
        setProfile({ ...user, username: user.username || i18n.t("member") });
      }).catch(() => undefined);
    }).catch(() => setAuthenticated(false)).finally(() => setLoading(false));
  }, [i18n, setAuthenticated, setLoading, setProfile, setRoles, syncToken, t]);
}
