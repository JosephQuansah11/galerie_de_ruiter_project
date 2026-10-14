import type { Designer } from "@/models/antiques/Antique";
import { csrfHeaders } from "@/apis/client";
import { axiosInstance, backendBaseURL } from "./backendClient";
import { cachedRequest, invalidateCache } from "@/services/apiCache";

export async function getAllDesigners(): Promise<Designer[]> {
  return cachedRequest("designers", async () =>
    (await axiosInstance.get<Designer[]>(`${backendBaseURL}/api/designers`)).data);
}
export async function searchDesigners(query: string): Promise<Designer[]> {
  return cachedRequest(`designers:search:${query.trim().toLowerCase()}`, async () =>
    (await axiosInstance.get<Designer[]>(`${backendBaseURL}/api/designers/search`, { params: { query } })).data);
}
export async function createDesigner(designer: Omit<Designer, "id">): Promise<Designer> {
  const data = (await axiosInstance.post<Designer>(`${backendBaseURL}/api/designers/add/designer`, designer, {
    headers: await csrfHeaders(),
  })).data;
  invalidateCache("designers");
  return data;
}
