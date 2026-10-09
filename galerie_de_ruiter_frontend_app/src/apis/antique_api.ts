import type Antique from "@/models/antiques/Antique";
import type { AntiqueForm } from "@/models/antiques/Antique";
import { csrfHeaders } from "@/apis/client";
import { visitorId } from "@/services/visitorId";
import { axiosInstance, backendBaseURL } from "./backendClient";

export async function getAllAntiques(): Promise<Antique[]> {
  const response = await axiosInstance.get<Antique[] | { content?: Antique[]; antiques?: Antique[]; data?: Antique[] }>(`${backendBaseURL}/api/antiques`);
  const payload = response.data;
  return Array.isArray(payload) ? payload : payload.content ?? payload.antiques ?? payload.data ?? [];
}
export async function addAntique(antique: AntiqueForm): Promise<Antique> {
  const response = await axiosInstance.post<Antique>(`${backendBaseURL}/api/antiques`, antique, {
    timeout: 60000,
    headers: await csrfHeaders().then((headers) => ({ ...headers, "Content-Type": "application/json" })),
  });
  return response.data;
}
export async function updateAntique(id: string, antique: Pick<AntiqueForm, "title" | "description" | "price">): Promise<Antique> {
  const response = await axiosInstance.put<Antique>(`${backendBaseURL}/api/antiques/${id}`, antique, {
    headers: { ...(await csrfHeaders()), "Content-Type": "application/json" },
  });
  return response.data;
}
export async function deleteAntique(id: string): Promise<void> {
  await axiosInstance.delete(`${backendBaseURL}/api/antiques/${id}`, {
    headers: await csrfHeaders(),
  });
}
export type AntiqueEngagement = { antiqueId: string; viewCount: number; likeCount: number; liked: boolean };

/**
 * Headers for the public counters. The visitor id lets the API count one view and one like
 * per person. The CSRF token is sent when it is available, but the counters stay usable
 * without it: they are exempt on the API side, so a failed token handshake must not stop
 * the gallery from seeing who looked at a piece.
 */
async function engagementHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {};
  try {
    Object.assign(headers, await csrfHeaders());
  } catch {
    // Fall through: the counter endpoints do not require a CSRF token.
  }
  const id = visitorId();
  if (id) headers["X-Visitor-Id"] = id;
  return headers;
}

/**
 * Counts the visitor as someone who has seen this piece. The API counts each visitor once,
 * so reopening a page does not inflate the gallery's numbers.
 */
export async function registerAntiqueView(id: string): Promise<AntiqueEngagement> {
  const response = await axiosInstance.post<AntiqueEngagement>(`${backendBaseURL}/api/antiques/${id}/views`,
    undefined, { headers: await engagementHeaders() });
  return response.data;
}

/** Adds or removes this visitor's like and returns the public counters. */
export async function setAntiqueLike(id: string, liked: boolean): Promise<AntiqueEngagement> {
  const config = { headers: await engagementHeaders() };
  const response = liked
    ? await axiosInstance.post<AntiqueEngagement>(`${backendBaseURL}/api/antiques/${id}/likes`, undefined, config)
    : await axiosInstance.delete<AntiqueEngagement>(`${backendBaseURL}/api/antiques/${id}/likes`, config);
  return response.data;
}

export async function uploadAntiqueImage(id: string, image: File): Promise<void> {
  const body = new FormData();
  body.append("image", image);
  await axiosInstance.put(`${backendBaseURL}/api/antiques/${id}/image`, body, {
    timeout: 60000,
    headers: { ...(await csrfHeaders()), "Content-Type": undefined },
  });
}
export async function uploadAntiqueModel(id: string, model: File): Promise<Antique> {
  const body = new FormData();
  body.append("model", model);
  // GLB models are large binaries: give the upload a long window so a slow connection
  // does not look like an unreachable service.
  const response = await axiosInstance.put<Antique>(`${backendBaseURL}/api/antiques/${id}/model`, body, {
    timeout: 900000,
    headers: { ...(await csrfHeaders()), "Content-Type": undefined },
  });
  return response.data;
}
