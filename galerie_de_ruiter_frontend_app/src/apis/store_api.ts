import { csrfHeaders } from "@/apis/client";
import { axiosInstance, backendBaseURL } from "./backendClient";
import type { AboutContent, StoreLocation } from "./apiTypes";

export async function getAboutContent(): Promise<AboutContent> {
  return (await axiosInstance.get<AboutContent>(`${backendBaseURL}/api/about`)).data;
}
export async function updateAboutContent(content: string): Promise<AboutContent> {
  return (await axiosInstance.put<AboutContent>(`${backendBaseURL}/api/about`, { content }, { headers: await csrfHeaders() })).data;
}
export async function getStoreLocation(): Promise<StoreLocation> {
  return (await axiosInstance.get<StoreLocation>(`${backendBaseURL}/api/location`)).data;
}
export async function updateStoreLocation(location: Omit<StoreLocation, "id">): Promise<StoreLocation> {
  return (await axiosInstance.put<StoreLocation>(`${backendBaseURL}/api/location`, location)).data;
}
