import type Antique from "@/models/antiques/Antique";
import type { AntiqueForm } from "@/models/antiques/Antique";
import axios from "axios";
import { csrfHeaders } from "@/apis/client";
import { visitorId } from "@/services/visitorId";
import { toWebp } from "@/services/imageConversion";
import { axiosInstance, backendBaseURL } from "./backendClient";
import { cachedRequest, invalidateCache } from "@/services/apiCache";
import type { AntiqueImage } from "./apiTypes";

export async function getAllAntiques(): Promise<Antique[]> {
  return cachedRequest("antiques", async () => {
    const response = await axiosInstance.get<Antique[] | { content?: Antique[]; antiques?: Antique[]; data?: Antique[] }>(`${backendBaseURL}/api/antiques`);
    const payload = response.data;
    return Array.isArray(payload) ? payload : payload.content ?? payload.antiques ?? payload.data ?? [];
  });
}
export async function addAntique(antique: AntiqueForm): Promise<Antique> {
  const response = await axiosInstance.post<Antique>(`${backendBaseURL}/api/antiques`, antique, {
    timeout: 60000,
    headers: await csrfHeaders().then((headers) => ({ ...headers, "Content-Type": "application/json" })),
  });
  invalidateCache("antiques");
  return response.data;
}
export async function updateAntique(id: string, antique: {
  title: string;
  description?: string | null;
  /** Omit to keep the piece's current price. */
  price?: number;
  /** Omit to keep the piece's current artist. */
  artistId?: string;
  /** Omit to keep the piece's current category. */
  categoryId?: string;
}): Promise<Antique> {
  const response = await axiosInstance.put<Antique>(`${backendBaseURL}/api/antiques/${id}`, antique, {
    headers: { ...(await csrfHeaders()), "Content-Type": "application/json" },
  });
  invalidateCache("antiques");
  return response.data;
}
/**
 * Records that the client and the gallery have agreed on payment. {@code sold: true} marks
 * the piece as sold (it is no longer offered for purchase); {@code false} puts it back on offer.
 */
export async function setAntiqueSold(id: string, sold: boolean): Promise<Antique> {
  const response = await axiosInstance.put<Antique>(`${backendBaseURL}/api/antiques/${id}/sold`, { sold }, {
    headers: { ...(await csrfHeaders()), "Content-Type": "application/json" },
  });
  invalidateCache("antiques");
  return response.data;
}
export async function deleteAntique(id: string): Promise<void> {
  await axiosInstance.delete(`${backendBaseURL}/api/antiques/${id}`, {
    headers: await csrfHeaders(),
  });
  invalidateCache("antiques");
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

export async function uploadAntiqueImage(id: string, image: File): Promise<AntiqueImage> {
  // Every entry point - the add form, the inventory editor and the folder import - uploads
  // through here, so a photograph is converted to WebP once, before it leaves the browser. The
  // API converts again if an older client sends a JPEG; a browser that cannot encode WebP falls
  // back to the original file.
  const prepared = await toWebp(image);
  const body = new FormData();
  body.append("image", prepared);
  const response = await axiosInstance.put<AntiqueImage>(`${backendBaseURL}/api/antiques/${id}/image`, body, {
    timeout: 60000,
    headers: { ...(await csrfHeaders()), "Content-Type": undefined },
  });
  invalidateCache("antiques");
  return response.data;
}
/**
 * Stores the gallery's preferred order for a piece's photographs, first to last. The first id
 * becomes the piece's main image.
 */
export async function reorderAntiqueImages(id: string, imageIds: string[]): Promise<void> {
  await axiosInstance.put(`${backendBaseURL}/api/antiques/${id}/image/order`, { imageIds }, {
    headers: { ...(await csrfHeaders()), "Content-Type": "application/json" },
  });
  invalidateCache("antiques");
}
/**
 * Removes one photograph from a piece so the gallery can correct a wrong image without
 * deleting the whole antique.
 */
export async function deleteAntiqueImage(id: string, imageId: string): Promise<void> {
  await axiosInstance.delete(`${backendBaseURL}/api/antiques/${id}/image/${imageId}`, {
    headers: await csrfHeaders(),
  });
  invalidateCache("antiques");
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
  invalidateCache("antiques");
  return response.data;
}

/**
 * Render answers 502/503 while a deploy restarts the API, and its proxy answers 502 if a request
 * outlives it. Those are temporary and the same call works a moment later, so the conversion
 * retries them instead of showing a network error. A request that was already processed is safe to
 * repeat: the conversion only looks at photographs that are not WebP yet.
 */
function isTransient(error: unknown): boolean {
  if (!axios.isAxiosError(error)) return false;
  // A request that ran into its own timeout is not a deploy window; retrying it would only make
  // the curator wait longer for the same answer.
  if (error.code === "ECONNABORTED" || error.code === "ERR_CANCELED") return false;
  const status = error.response?.status;
  return status === undefined || status === 502 || status === 503 || status === 504;
}

async function withRetry<T>(request: () => Promise<T>, attempts = 3): Promise<T> {
  for (let attempt = 1; ; attempt += 1) {
    try {
      return await request();
    } catch (error) {
      if (attempt >= attempts || !isTransient(error)) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1500 * attempt));
    }
  }
}

/** How much of the catalogue is already WebP, and whether this API can encode it at all. */
export type ImageFormatStatus = {
  webpEncoder: boolean;
  total: number;
  webp: number;
  /** Photographs that still have to be converted. */
  candidates: number;
};

/** What one conversion run did; a dry run reports the counts without rewriting anything. */
export type ImageFormatReport = {
  dryRun: boolean;
  total: number;
  webp: number;
  candidates: number;
  converted: number;
  bytesBefore: number;
  bytesAfter: number;
  failed: { imageId: string; reason: string }[];
};

export async function getImageFormatStatus(): Promise<ImageFormatStatus> {
  return withRetry(async () => {
    const response = await axiosInstance.get<ImageFormatStatus>(`${backendBaseURL}/api/admin/images/format-status`);
    return response.data;
  });
}

/**
 * Rewrites the photographs that are not WebP yet, with `confirm` after the admin has seen the
 * counts. Without it the API only reports what is left to do. One call converts at most `limit`
 * pictures, so a large catalogue is done in batches instead of one request that can time out.
 */
export async function convertImagesToWebp(confirm = false, limit = 10): Promise<ImageFormatReport> {
  return withRetry(async () => {
    const response = await axiosInstance.post<ImageFormatReport>(
      `${backendBaseURL}/api/admin/images/convert-to-webp`, undefined, {
        params: { confirm, limit },
        // A batch of ten photographs is well inside a proxy's request window.
        timeout: 900000,
        headers: await csrfHeaders(),
      });
    invalidateCache("antiques");
    return response.data;
  });
}
