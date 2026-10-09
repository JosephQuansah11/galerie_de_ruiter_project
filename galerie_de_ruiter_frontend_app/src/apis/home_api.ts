import { csrfHeaders } from "@/apis/client";
import { axiosInstance, backendBaseURL } from "./backendClient";

/** Editable copy for the dashboard / home page. Blank fields use the translated default. */
export type HomeContent = {
  heroTitle?: string | null;
  heroIntro?: string | null;
  philosophyText?: string | null;
  visitText?: string | null;
  storyParagraphs?: string | null;
};

export async function getHomeContent(): Promise<HomeContent> {
  return (await axiosInstance.get<HomeContent>(`${backendBaseURL}/api/home`)).data;
}

export async function updateHomeContent(content: HomeContent): Promise<HomeContent> {
  const { data } = await axiosInstance.put<HomeContent>(`${backendBaseURL}/api/home`, content, {
    headers: await csrfHeaders(),
  });
  return data;
}

/** A photograph in the welcome page slider; the API stores it as binary. */
export type HomeImage = { id: string; url: string; caption?: string | null };

/** Slider images live on the API origin, so relative URLs are resolved against it. */
export function resolveHomeImageUrl(url: string): string {
  return /^https?:\/\//i.test(url) ? url : `${backendBaseURL}${url.startsWith("/") ? "" : "/"}${url}`;
}

export async function getHomeImages(): Promise<HomeImage[]> {
  return (await axiosInstance.get<HomeImage[]>(`${backendBaseURL}/api/home/images`)).data;
}

export async function uploadHomeImage(image: File, caption?: string): Promise<HomeImage> {
  const form = new FormData();
  form.append("image", image);
  if (caption?.trim()) form.append("caption", caption.trim());
  const { data } = await axiosInstance.post<HomeImage>(`${backendBaseURL}/api/home/images`, form, {
    timeout: 120000,
    headers: { ...(await csrfHeaders()), "Content-Type": undefined },
  });
  return data;
}

export async function deleteHomeImage(id: string): Promise<void> {
  await axiosInstance.delete(`${backendBaseURL}/api/home/images/${id}`, { headers: await csrfHeaders() });
}
