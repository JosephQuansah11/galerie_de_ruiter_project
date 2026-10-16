import { useEffect, useRef, type Dispatch, type SetStateAction } from "react";
import { useTranslation } from "react-i18next";
import type { UserProfile } from "@/types/types";
import { syncCurrentUser } from "@/pages/auth/authApi";
import { clearKeycloakSession, readKeycloakSession, writeKeycloakSession } from "@/services/keycloakSession";
import { keycloak } from "./keycloakClient";

type Setup = { setAuthenticated: Dispatch<SetStateAction<boolean>>; setLoading: Dispatch<SetStateAction<boolean>>;
  setProfile: Dispatch<SetStateAction<UserProfile | undefined>>; setRoles: Dispatch<SetStateAction<string[]>>;
  syncToken: (token?: string) => void };
/**
 * The roles the API's `SecurityConfiguration` accepts on `GET /api/me`. It lives here rather than
 * being discovered, because a request this app knows will be refused is one it should not send:
 * see the note where it is used.
 */
const PROFILE_ROLES = ["USER", "ADMIN"];
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
     * The sign-in round trip returns to the redirect URI, so it has to be the page the visitor
     * asked for. A reload on a deep link (for example the inventory or the categories screen) used
     * to land on the dashboard instead, which looked like the page had vanished.
     */
    const requestedPath = `${window.location.pathname}${window.location.search}`;
    /**
     * No `onLoad`: nothing here navigates to the identity provider while the page loads. A stored
     * session is handed to the adapter instead, which refreshes it against the token endpoint
     * before `init` answers - so a reload and a new tab are the same signed-in visitor, without a
     * redirect and without asking anyone else for a cookie.
     *
     * `onLoad: "check-sso"` is what this used to ask for, with `silentCheckSsoRedirectUri` naming a
     * page of ours for the adapter to answer through. Such a check only works where third-party
     * cookies work, and keycloak-js tests for them first by loading Keycloak's third-party-cookie
     * probe (`.../3p-cookies/step1.html`) in a hidden iframe of its own. That frame is cross-origin
     * and Keycloak serves it with no Cross-Origin-Resource-Policy - a header this site cannot add
     * to someone else's server - so the site's own Cross-Origin-Embedder-Policy refused to load it:
     * the probe never answered, the adapter rejected on its ten-second timeout, and the sign-in
     * button did nothing, because it builds its URL from the endpoints `init` discovers.
     *
     * Where the probe did answer, it answered "unsupported" - current browsers block third-party
     * cookies - and the adapter then cleared the silent redirect and navigated the whole document
     * to Keycloak. That is the round trip the first screen spends its budget avoiding.
     *
     * Signing in is now the only thing that talks to the identity provider, and it is one
     * navigation: a visitor who still has a session there does not see the form, because Keycloak
     * answers with the session it already has.
     *
     * `checkLoginIframe: false` keeps the adapter from polling the session status in a second
     * iframe, and `redirectUri` names where the visitor comes back to.
     */
    const stored = readKeycloakSession();
    keycloak.init({ pkceMethod: "S256", checkLoginIframe: false, ...(stored ?? {}),
      redirectUri: `${window.location.origin}${requestedPath === "/login" ? "/" : requestedPath}` }).then((isAuthenticated) => {
      setAuthenticated(isAuthenticated); syncToken(keycloak.token);
      if (!isAuthenticated) return;
      // The session now outlives this page load. Keycloak rotates the refresh token as it refreshes
      // it, so the stored copy is written again every time the adapter reports a new one (see
      // useKeycloakToken) - this is the copy a fresh page load starts from.
      if (keycloak.token && keycloak.refreshToken) {
        writeKeycloakSession({ token: keycloak.token, refreshToken: keycloak.refreshToken, idToken: keycloak.idToken });
      }
      const data = keycloak.tokenParsed as { preferred_username?: string; email?: string;
        given_name?: string; family_name?: string;
        realm_access?: { roles?: string[] }; resource_access?: Record<string, { roles?: string[] }> } | undefined;
      const roles = [...(data?.realm_access?.roles ?? []), ...Object.values(data?.resource_access ?? {}).flatMap((item) => item.roles ?? [])];
      setRoles([...new Set(roles)]); fallbackUsername.current = !data?.preferred_username;
      /**
       * The roles the API accepts on `/api/me` (see its `SecurityConfiguration`). It refuses a token
       * that carries neither of them with 403 - the resource server checks the role before the
       * endpoint runs - and the realm hands a role to nobody automatically, so a visitor who has just
       * registered holds a token this call cannot use. Asking anyway put a failed request in the
       * console on every page load for someone who is perfectly well signed in, and it answered
       * nothing for them either. The name, the email and the picture already came from the token
       * above, and the profile row is still created the first time they save anything.
       */
      const canReadProfile = roles.some((role) => PROFILE_ROLES.includes(role.replace(/^ROLE_/i, "").toUpperCase()));
      // The first and last name travel in the token, so the WhatsApp hand-off can name the
      // visitor even before the profile row exists — or when that row holds no names yet.
      setProfile({ username: data?.preferred_username ?? t("member"), email: data?.email,
        firstName: data?.given_name, lastName: data?.family_name });
      if (keycloak.token && canReadProfile) syncCurrentUser(keycloak.token).then((user) => {
        fallbackUsername.current = !user.username;
        setProfile((current) => ({ ...user, firstName: user.firstName ?? current?.firstName,
          lastName: user.lastName ?? current?.lastName, username: user.username || i18n.t("member") }));
      }).catch(() => undefined);
    }).catch(() => {
      // A stored session that Keycloak refused to refresh is dropped, so the next page load does
      // not present it again: the visitor starts from signed out, as if it had never been stored.
      clearKeycloakSession();
      setAuthenticated(false);
    }).finally(() => setLoading(false));
  }, [i18n, setAuthenticated, setLoading, setProfile, setRoles, syncToken, t]);
}
