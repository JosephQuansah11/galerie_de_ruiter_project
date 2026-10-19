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
 * A copy of a photograph at one of the sizes the API keeps. A grid tile has no use for a
 * six-megabyte original - the API makes a 400-pixel copy for it, an 800-pixel copy for a phone on
 * a piece's own page, and a 1600-pixel copy for a desktop - and the original is fetched only when
 * a visitor asks for it.
 *
 * A path that names no image id (`/api/antiques/{id}/image`, which means "the first photograph")
 * has no variant route, so it is returned untouched and the caller gets the original.
 */
type AntiqueImageVariant = "thumbnail" | "medium" | "large";

const resolveVariantUrl = (imageUrl: string | null | undefined, variant: AntiqueImageVariant): string | undefined => {
  const full = resolveAntiqueImageUrl(imageUrl);
  if (!full) return undefined;
  return /\/image\/[^/?#]+$/.test(full) ? `${full}/${variant}` : full;
};

export const resolveAntiqueThumbnailUrl = (imageUrl?: string | null): string | undefined =>
  resolveVariantUrl(imageUrl, "thumbnail");

/** The 800-pixel copy a phone draws on a piece's own page. */
export const resolveAntiqueMediumUrl = (imageUrl?: string | null): string | undefined =>
  resolveVariantUrl(imageUrl, "medium");

/** The 1600-pixel copy a desktop or a high-density screen draws. */
export const resolveAntiqueLargeUrl = (imageUrl?: string | null): string | undefined =>
  resolveVariantUrl(imageUrl, "large");

/**
 * The image id at the end of an antique image path (`/api/antiques/{id}/image/{imageId}`).
 * The admin edit screen uses it to remove one photograph without refetching the piece.
 */
export const antiqueImageIdFromUrl = (imageUrl?: string | null): string | undefined =>
  imageUrl?.match(/\/image\/([^/?#]+)$/)?.[1];

