import type Antique from "@/models/antiques/Antique";
import type { AntiqueForm } from "@/models/antiques/Antique";
import { csrfHeaders } from "@/apis/client";
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
  const response = await axiosInstance.put<Antique>(`${backendBaseURL}/api/antiques/${id}/model`, body, {
    timeout: 60000,
    headers: { ...(await csrfHeaders()), "Content-Type": undefined },
  });
  return response.data;
}
