import type { Designer } from "@/models/antiques/Antique";
import { axiosInstance, backendBaseURL } from "./backendClient";

export async function getAllDesigners(): Promise<Designer[]> {
  return (await axiosInstance.get<Designer[]>(`${backendBaseURL}/api/designers`)).data;
}
export async function searchDesigners(query: string): Promise<Designer[]> {
  return (await axiosInstance.get<Designer[]>(`${backendBaseURL}/api/designers/search`, { params: { query } })).data;
}
export async function createDesigner(designer: Omit<Designer, "id">): Promise<Designer> {
  return (await axiosInstance.post<Designer>(`${backendBaseURL}/api/designers/add/designer`, designer)).data;
}
