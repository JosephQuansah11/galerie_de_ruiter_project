import axiosInstance from "@/apis/authPromise";
import { readSession } from "@/context/useSupabaseSession";

/**
 * The token for every request made through this client - the one the artist search and the admin
 * screens use.
 *
 * It overwrites rather than fills a gap: this client was built around a promise of a Keycloak token,
 * and a stale `Authorization: Bearer undefined` is worse than no header at all, because it arrives
 * looking authenticated and is refused. Read from the stored session at request time, so it is right
 * on the first call after a page load and after a refresh.
 *
 * An expired session is not sent. The API's resource server validates a bearer token before it
 * consults the public route rules, so one expired token used to turn both `/api/antiques` and
 * `/api/categories` into 401s. The auth layer refreshes the session on load; until it does, public
 * reads must go out without it.
 */
axiosInstance.interceptors.request.use((request) => {
  // The 401 recovery in authPromise retries this exact request without a token. Re-reading the
  // stored session here would put the refused token straight back, so the retry has to be left
  // alone.
  if ((request as typeof request & { retriedWithoutToken?: boolean }).retriedWithoutToken) return request;
  const session = readSession();
  if (session?.accessToken && session.expiresAt > Date.now()) {
    request.headers.Authorization = `Bearer ${session.accessToken}`;
  } else {
    delete request.headers.Authorization;
  }
  return request;
});


import { apiBaseUrl } from "@/apis/apiConfig";
export const backendBaseURL = apiBaseUrl;
export { axiosInstance };
