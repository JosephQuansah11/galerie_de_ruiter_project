import axios, { type InternalAxiosRequestConfig } from "axios";
import { apiBaseUrl } from "@/apis/apiConfig";

const axiosInstance = axios.create({
  baseURL: apiBaseUrl,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

export const setAuthToken = (token: string | undefined) => {
  if (token) {
    axiosInstance.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete axiosInstance.defaults.headers.common.Authorization;
  }
};

type UnauthorizedHandler = () => void;
let onUnauthorized: UnauthorizedHandler | undefined;

/**
 * What the auth layer does when the API refuses the token it was given. It is registered by
 * `useKeycloakToken`, which ends the session the same way a failed refresh does.
 */
export const setUnauthorizedHandler = (handler?: UnauthorizedHandler) => {
  onUnauthorized = handler;
};

/**
 * A token the API cannot decode or has expired is refused with 401 - and on the public endpoints
 * too, because the resource server fails the request before authorization is consulted. The app
 * sends its token with every request, so one stale token used to empty the whole gallery: no
 * collection, no piece pages, nothing, for a visitor who is signed in.
 *
 * Dropping the refused token turns that into a signed-out visit, and the retry fetches the public
 * data, so the pages a visitor may read keep working. A request that was already retried is not
 * retried again, so a genuinely protected endpoint simply reports its 401.
 */
axiosInstance.interceptors.response.use(undefined, async (error) => {
  const config = error?.config as (InternalAxiosRequestConfig & { retriedWithoutToken?: boolean }) | undefined;
  const refused = error?.response?.status === 401 && config && !config.retriedWithoutToken
    && Boolean(config.headers?.Authorization);
  if (!refused) return Promise.reject(error);
  // The token is dropped from the defaults as well as from this request: axios merges the defaults
  // back in, so leaving it there would send the same refused token on the retry.
  setAuthToken(undefined);
  onUnauthorized?.();
  config.retriedWithoutToken = true;
  config.headers.Authorization = undefined;
  return axiosInstance.request(config);
});

export default axiosInstance;
