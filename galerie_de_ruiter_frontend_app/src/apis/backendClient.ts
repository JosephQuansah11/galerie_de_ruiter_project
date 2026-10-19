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
 */
axiosInstance.interceptors.request.use((request) => {
  const token = readSession()?.accessToken;
  if (token) request.headers.Authorization = `Bearer ${token}`;
  return request;
});


import { apiBaseUrl } from "@/apis/apiConfig";
export const backendBaseURL = apiBaseUrl;
export { axiosInstance };
