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

/**
 * The small copy of a photograph, for a grid or a list: the same image path with `/thumbnail`
 * appended (`/api/antiques/{id}/image/{imageId}/thumbnail`).
 *
 * A grid tile has no use for a six-megabyte original - the API makes a 400-pixel copy about forty
 * kilobytes for it, and the original is fetched only when a piece is opened.
 *
 * A path that names no image id (`/api/antiques/{id}/image`, which means "the first photograph")
 * has no thumbnail route, so it is returned untouched and the caller gets the original.
 */
export const resolveAntiqueThumbnailUrl = (imageUrl?: string | null): string | undefined => {
  const full = resolveAntiqueImageUrl(imageUrl);
  if (!full) return undefined;
  return /\/image\/[^/?#]+$/.test(full) ? `${full}/thumbnail` : full;
};

/**
 * The image id at the end of an antique image path (`/api/antiques/{id}/image/{imageId}`).
 * The admin edit screen uses it to remove one photograph without refetching the piece.
 */
export const antiqueImageIdFromUrl = (imageUrl?: string | null): string | undefined =>
  imageUrl?.match(/\/image\/([^/?#]+)$/)?.[1];

