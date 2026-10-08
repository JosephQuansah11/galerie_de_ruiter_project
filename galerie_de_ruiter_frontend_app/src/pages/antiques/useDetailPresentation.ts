import type Antique from "@/models/antiques/Antique";
import { resolveAntiqueImageUrl } from "@/models/antiques/Antique";
import { formatEuroAmount } from "@/i18n";
import type { Position, Translate } from "./detailTypes";
import type { ReconstructionJob } from "@/apis/reconstruction_api";
import { backendBaseURL } from "@/apis/backendClient";

export function getDetailPresentation(antique: Antique, antiques: Antique[], locale: string,
  selectedImage: string | undefined, images: Partial<Record<Position, File>>,
  previews: Partial<Record<Position, string>>, activeView: Position, job: ReconstructionJob | undefined, t: Translate) {
  const tArtist = antique.artist?.displayName ?? antique.artist?.name ?? t("galerieDeRuiterCollection");
  const price = antique.price == null ? t("priceOnRequest") : formatEuroAmount(antique.price, locale);
  const related = antiques.filter((item) => item.id !== antique.id).sort((a, b) =>
    Number(b.category === antique.category) - Number(a.category === antique.category));
  const baseUrl = import.meta.env.VITE_RECONSTRUCTION_API_URL ?? "http://localhost:8000";
  const views = new Map<Position, string>();
  (antique.sixViewImages ?? []).forEach((view) => views.set(
    view.position as Position,
    view.url.startsWith("/api/") ? `${backendBaseURL}${view.url}` : view.url,
  ));
  (job?.image_views ?? []).forEach((view) => views.set(view.position as Position, `${baseUrl}${view.url}`));
  const imageUrls = antique.imageUrls?.length ? antique.imageUrls : antique.imageUrl ? [antique.imageUrl] : [];
  const preview = selectedImage ?? imageUrls[0];
  const model = job?.model_url ?? antique.modelUrl;
  const modelUrl = model?.startsWith("http") ? model
    : model?.startsWith("/api/") ? `${backendBaseURL}${model}`
      : model ? `${baseUrl}${model}` : undefined;
  const activeImage = views.get(activeView) ?? previews[activeView];
  const frontImage = images.front ?? (preview ? resolveAntiqueImageUrl(preview) : undefined) ?? activeImage;
  return { artist: tArtist, price, related, baseUrl, views, imageUrls, preview, modelUrl, activeImage, frontImage };
}
