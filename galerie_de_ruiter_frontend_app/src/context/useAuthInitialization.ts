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
    /**
     * The silent sign-in round trip returns to the redirect URI, so it has to be the page the
     * visitor asked for. A reload on a deep link (for example the inventory or the categories
     * screen) used to land on the dashboard instead, which looked like the page had vanished.
     */
    const requestedPath = `${window.location.pathname}${window.location.search}`;
    keycloak.init({ onLoad: "check-sso", pkceMethod: "S256", checkLoginIframe: false,
      redirectUri: `${window.location.origin}${requestedPath === "/login" ? "/home" : requestedPath}` }).then((isAuthenticated) => {
      setAuthenticated(isAuthenticated); syncToken(keycloak.token);
      if (!isAuthenticated) return;
      const data = keycloak.tokenParsed as { preferred_username?: string; email?: string;
        given_name?: string; family_name?: string;
        realm_access?: { roles?: string[] }; resource_access?: Record<string, { roles?: string[] }> } | undefined;
      const roles = [...(data?.realm_access?.roles ?? []), ...Object.values(data?.resource_access ?? {}).flatMap((item) => item.roles ?? [])];
      setRoles([...new Set(roles)]); fallbackUsername.current = !data?.preferred_username;
      // The first and last name travel in the token, so the WhatsApp hand-off can name the
      // visitor even before the profile row exists — or when that row holds no names yet.
      setProfile({ username: data?.preferred_username ?? t("member"), email: data?.email,
        firstName: data?.given_name, lastName: data?.family_name });
      if (keycloak.token) syncCurrentUser(keycloak.token).then((user) => {
        fallbackUsername.current = !user.username;
        setProfile((current) => ({ ...user, firstName: user.firstName ?? current?.firstName,
          lastName: user.lastName ?? current?.lastName, username: user.username || i18n.t("member") }));
      }).catch(() => undefined);
    }).catch(() => setAuthenticated(false)).finally(() => setLoading(false));
  }, [i18n, setAuthenticated, setLoading, setProfile, setRoles, syncToken, t]);
}
