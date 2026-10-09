import { apiBaseUrl } from "@/apis/apiConfig";

/**
 * The API returns asset paths relative to its own origin (for example
 * `/api/antiques/{id}/image` or `/api/antiques/{id}/model`). Resolving them through
 * apiConfig keeps photographs and GLB models on the same origin as every other request,
 * in development and in production, instead of falling back to localhost in a build that
 * only defines one of the VITE_* variables.
 */
export const resolveAntiqueImageUrl = (imageUrl?: string | null): string | undefined => {
  if (!imageUrl) return undefined;
  if (/^https?:\/\//i.test(imageUrl)) return imageUrl;
  const path = imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`;
  return `${apiBaseUrl}${path}`;
};

