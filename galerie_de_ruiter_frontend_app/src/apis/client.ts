import axios from 'axios'

export const javaApi = axios.create({
  baseURL: import.meta.env.VITE_JAVA_API_URL ?? 'http://localhost:8080',
  withCredentials: true,
})

export const pythonApi = axios.create({
  baseURL: import.meta.env.VITE_PYTHON_API_URL ?? 'http://localhost:8000',
  withCredentials: true,
})

export function bearerHeaders(token: string) {
  return { Authorization: `Bearer ${token}` }
}

export async function csrfHeaders() {
  const { data } = await javaApi.get<{ token: string }>('/users/csrf')
  return { 'X-XSRF-TOKEN': data.token }
}
