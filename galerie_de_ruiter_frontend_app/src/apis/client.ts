import axios, { type AxiosInstance } from 'axios'
import { apiBaseUrl, pythonApiBaseUrl } from './apiConfig'

export const javaApi = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
})

export const pythonApi = axios.create({
  baseURL: pythonApiBaseUrl,
  withCredentials: true,
})

export function bearerHeaders(token: string) {
  return { Authorization: `Bearer ${token}` }
}

const csrfName = 'XSRF-TOKEN'
const csrfHeader = 'X-XSRF-TOKEN'
const crossOriginCsrfClient = axios.create({ baseURL: apiBaseUrl, withCredentials: true, timeout: 20000 })

function csrfClient(baseUrl: string): AxiosInstance {
  if (baseUrl === apiBaseUrl) return crossOriginCsrfClient
  return axios.create({ baseURL: baseUrl, withCredentials: true, timeout: 20000 })
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

/**
 * Requests a CSRF token from the same origin that will receive the write request.
 */
export async function csrfHeaders(baseUrl: string = apiBaseUrl) {
  try {
    const { data } = await csrfClient(baseUrl).get<{ token?: string }>('/api/login')
    if (data?.token) return { [csrfHeader]: data.token }
  } catch {
    // Fall through to the cookie so a blocked or slow token endpoint is not fatal.
  }
  const token = readCsrfCookie()
  if (token) return { [csrfHeader]: token }
  throw new Error('Could not obtain a CSRF token from the API.')
}
