import { csrfHeaders } from "@/apis/client";
import { axiosInstance, backendBaseURL } from "./backendClient";
import type { AboutContent, AboutImage, StoreLocation } from "./apiTypes";
import { cachedRequest, invalidateCache } from "@/services/apiCache";
import { toWebp } from "@/services/imageConversion";

export async function getAboutContent(): Promise<AboutContent> {
  return cachedRequest("about", async () =>
    (await axiosInstance.get<AboutContent>(`${backendBaseURL}/api/about`)).data);
}
export async function updateAboutContent(content: string): Promise<AboutContent> {
  const result = (await axiosInstance.put<AboutContent>(`${backendBaseURL}/api/about`, { content }, { headers: await csrfHeaders() })).data;
  invalidateCache("about");
  return result;
}
export async function getStoreLocation(): Promise<StoreLocation> {
  return cachedRequest("location", async () =>
    (await axiosInstance.get<StoreLocation>(`${backendBaseURL}/api/location`)).data);
}
export async function updateStoreLocation(location: Omit<StoreLocation, "id">): Promise<StoreLocation> {
  const result = (await axiosInstance.put<StoreLocation>(`${backendBaseURL}/api/location`, location, {
    headers: await csrfHeaders(),
  })).data;
  invalidateCache("location");
  return result;
}
/**
 * Uploads a photograph for the About page and returns the URL to insert into the story. The
 * bytes live in the gallery database, like the welcome slider images.
 */
export async function uploadAboutImage(image: File): Promise<AboutImage> {
  const form = new FormData();
  form.append("image", await toWebp(image));
  return (await axiosInstance.post<AboutImage>(`${backendBaseURL}/api/about/images`, form, {
    timeout: 120000,
    headers: { ...(await csrfHeaders()), "Content-Type": undefined },
  })).data;
}
