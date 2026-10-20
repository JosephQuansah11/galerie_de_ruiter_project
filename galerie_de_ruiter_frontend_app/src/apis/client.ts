import axios, { type AxiosInstance } from 'axios'
import { apiBaseUrl } from './apiConfig'
import { readSession } from '@/context/useSupabaseSession'

export const javaApi = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
})

/**
 * Adds the signed-in visitor's token to every request a client makes.
 *
 * It is read from the stored session at the moment of the request rather than being passed in by
 * each caller, because passing it in is how a call site gets forgotten: the avatar request used to
 * rely on a cookie and went out bare, and the artist search uses a second client that was not
 * covered. A caller that has a token of its own still wins - the header is only added when absent.
 */
export function attachSessionToken(client: AxiosInstance): AxiosInstance {
  client.interceptors.request.use((request) => {
    if (request.headers?.Authorization) return request
    const session = readSession()
    if (session?.accessToken && session.expiresAt > Date.now()) {
      request.headers.Authorization = `Bearer ${session.accessToken}`
    }
    return request
  })
  return client
}

attachSessionToken(javaApi)

export function bearerHeaders(token: string) {
  return { Authorization: `Bearer ${token}` }
}

const csrfName = 'XSRF-TOKEN'
const csrfHeader = 'X-XSRF-TOKEN'
const crossOriginCsrfClient = axios.create({ baseURL: apiBaseUrl, withCredentials: true, timeout: 10000 })
const csrfClients = new Map<string, AxiosInstance>()
const csrfTokens = new Map<string, string>()
const csrfRequests = new Map<string, Promise<string | undefined>>()

function csrfClient(baseUrl: string): AxiosInstance {
  if (baseUrl === apiBaseUrl) return crossOriginCsrfClient
  const existing = csrfClients.get(baseUrl)
  if (existing) return existing
  const client = axios.create({ baseURL: baseUrl, withCredentials: true, timeout: 10000 })
  csrfClients.set(baseUrl, client)
  return client
}

/**
 * The CSRF cookie is stored without HttpOnly so the single page app can send it back
 * as a header. Reading the cookie is the fallback when the token endpoint call is
 * blocked, which keeps cross-origin deployments (separate frontend and API hosts)
 * working.
 */
export function readCsrfCookie(): string | undefined {
  if (typeof document === 'undefined') return undefined
  const entry = document.cookie.split('; ').find((item) => item.startsWith(`${csrfName}=`))
  if (!entry) return undefined
  const value = entry.slice(csrfName.length + 1)
  return value.length > 0 ? decodeURIComponent(value) : undefined
}

/** Drops the cached token after a sign-out, so the next write asks the new session for one. */
export function clearCsrfTokenCache(): void {
  csrfTokens.clear()
  csrfRequests.clear()
}

async function requestCsrfToken(baseUrl: string): Promise<string | undefined> {
  try {
    const { data } = await csrfClient(baseUrl).get<{ token?: string }>('/api/login')
    return data?.token ?? readCsrfCookie()
  } catch {
    // A blocked or slow token endpoint is not fatal when the cookie is already there.
    return readCsrfCookie()
  }
}

/**
 * Requests a CSRF token from the same origin that will receive the write request.
 *
 * The cookie the API set is the answer most of the time; it used to call `/api/login` on every
 * write, which added a second request to every category or profile save and failed the whole save
 * whenever that request happened to meet a restarting API. The token is cached and concurrent
 * writes share one request.
 */
export async function csrfHeaders(baseUrl: string = apiBaseUrl) {
  const cookie = readCsrfCookie()
  if (cookie) {
    csrfTokens.set(baseUrl, cookie)
    return { [csrfHeader]: cookie }
  }
  const cached = csrfTokens.get(baseUrl)
  if (cached) return { [csrfHeader]: cached }
  let pending = csrfRequests.get(baseUrl)
  if (!pending) {
    pending = requestCsrfToken(baseUrl).finally(() => csrfRequests.delete(baseUrl))
    csrfRequests.set(baseUrl, pending)
  }
  const token = await pending
  if (token) {
    csrfTokens.set(baseUrl, token)
    return { [csrfHeader]: token }
  }
  throw new Error('Could not obtain a CSRF token from the API.')
}
