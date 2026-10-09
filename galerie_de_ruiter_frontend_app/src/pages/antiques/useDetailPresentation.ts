import type Antique from "@/models/antiques/Antique";
import { formatEuroAmount } from "@/i18n";
import type { Translate } from "./detailTypes";
import { backendBaseURL } from "@/apis/backendClient";

/**
 * Presentation data for one antique: artist, price, gallery images and the GLB model.
 * Only GLB/GLTF models are resolved, because the canvas viewer renders those.
 */
export function getDetailPresentation(antique: Antique, antiques: Antique[], locale: string,
  selectedImage: string | undefined, t: Translate) {
  const artist = antique.artist?.displayName ?? antique.artist?.name ?? t("galerieDeRuiterCollection");
  const price = antique.price == null ? t("priceOnRequest") : formatEuroAmount(antique.price, locale);
  const related = antiques.filter((item) => item.id !== antique.id).sort((a, b) =>
    Number(b.category === antique.category) - Number(a.category === antique.category));
  const imageUrls = antique.imageUrls?.length ? antique.imageUrls : antique.imageUrl ? [antique.imageUrl] : [];
  const preview = selectedImage ?? imageUrls[0];
  const modelUrl = isViewableModelUrl(antique.modelUrl) ? resolveModelUrl(antique.modelUrl!.trim()) : undefined;
  return { artist, price, related, imageUrls, preview, modelUrl };
}

/**
 * The canvas viewer only accepts GLB/GLTF models: a model served from the API model
 * endpoint, or an uploaded `.glb`/`.gltf`/`.webl` file.
 */
export function isViewableModelUrl(modelUrl?: string | null): boolean {
  if (!modelUrl || !modelUrl.trim()) return false;
  const value = modelUrl.trim();
  if (/^\/api\/antiques\/[^/]+\/model$/i.test(value)) return true;
  return /\.(glb|gltf|webl)(\?.*)?$/i.test(value);
}

function resolveModelUrl(modelUrl: string): string {
  if (/^https?:\/\//i.test(modelUrl)) return modelUrl;
  const path = modelUrl.startsWith("/") ? modelUrl : `/${modelUrl}`;
  return `${backendBaseURL}${path}`;
}

