import { bearerHeaders, csrfHeaders, javaApi } from '../../apis/client'
import type { UserProfile } from '../../types/types'

export async function registerUser(profile: UserProfile & { password: string }): Promise<UserProfile> {
  const { data } = await javaApi.post<UserProfile>('/api/register', profile, { headers: await csrfHeaders() })
  return data
}

export async function syncCurrentUser(token: string): Promise<UserProfile> {
  const { data } = await javaApi.get<UserProfile>('/api/me', { headers: bearerHeaders(token) })
  return data
}
