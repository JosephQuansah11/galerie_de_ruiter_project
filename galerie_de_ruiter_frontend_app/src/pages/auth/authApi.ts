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
