import { bearerHeaders, csrfHeaders, javaApi } from '../../apis/client'
import type { UserProfile, UserProfileUpdate } from '../../types/types'

export async function registerUser(profile: UserProfile & { password: string }): Promise<UserProfile> {
  const { data } = await javaApi.post<UserProfile>('/api/register', profile, { headers: await csrfHeaders() })
  return data
}

export async function syncCurrentUser(token: string): Promise<UserProfile> {
  const { data } = await javaApi.get<BackendUser>('/api/me', { headers: bearerHeaders(token) })
  return toUserProfile(data)
}

export async function updateCurrentUser(token: string, profile: UserProfileUpdate): Promise<UserProfile> {
  const { data } = await javaApi.put<BackendUser>('/api/me', profile, {
    headers: { ...bearerHeaders(token), ...(await csrfHeaders()) },
  })
  return toUserProfile(data)
}

type BackendUser = Partial<UserProfile> & { displayName?: string }

function toUserProfile(user: BackendUser): UserProfile {
  return {
    ...user,
    username: user.username ?? user.displayName ?? '',
  }
}

/**
 * The identity providers the gallery's realm offers, by alias. The sign-in page asks before it
 * offers a button for one of them: Google is provisioned into the realm by the API, so the realm -
 * not this build - is what knows whether that button can lead anywhere.
 */
export async function getIdentityProviders(): Promise<string[]> {
  const { data } = await javaApi.get<{ providers?: string[] }>('/api/auth/providers')
  return data.providers ?? []
}
