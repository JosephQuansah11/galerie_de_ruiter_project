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
    headers: await csrfHeaders(),
  });
  return response.data;
}
export async function uploadAntiqueImage(id: string, image: File): Promise<void> {
  const body = new FormData();
  body.append("image", image);
  await axiosInstance.put(`${backendBaseURL}/api/antiques/${id}/image`, body, {
    headers: { ...(await csrfHeaders()), "Content-Type": undefined },
  });
}
