import { Button } from "@/components/ReactButton";
import type Antique from "@/models/antiques/Antique";
import { resolveAntiqueImageUrl, resolveAntiqueLargeUrl, resolveAntiqueMediumUrl, resolveAntiqueThumbnailUrl } from "@/models/antiques/Antique";
import type { Translate } from "./detailTypes";

type Props = { antique: Antique; urls: string[]; preview?: string; select: (url: string) => void; t: Translate };
export function DetailMedia({ antique, urls, preview, select, t }: Props) {
  const medium = resolveAntiqueMediumUrl(preview);
  const large = resolveAntiqueLargeUrl(preview);
  return <div className="detail-media">
    <div className="detail-image" aria-label={t("previewNamed", { title: antique.title })}>
      {preview ? <img
        src={large ?? resolveAntiqueImageUrl(preview)}
        srcSet={medium && large ? `${medium} 800w, ${large} 1600w` : undefined}
        sizes="(max-width: 900px) 100vw, 800px"
        alt={antique.title}
        loading="eager"
        fetchPriority="high"
        decoding="async"
        width={800}
        height={600}
      /> : antique.title.slice(0, 1).toUpperCase()}
    </div>
    {urls.length > 1 && <div className="detail-image-gallery" aria-label={t("additionalImages")}>
      {urls.map((url, index) => <Button key={url} className={preview === url ? "is-selected" : undefined}
        type="button" onClick={() => select(url)} aria-label={t("previewImageNumber", { title: antique.title, number: index + 1 })}>
        <img src={resolveAntiqueThumbnailUrl(url)} alt={`${antique.title}, ${index + 1}`} loading="lazy" decoding="async" width={400} height={400} /></Button>)}
    </div>}
  </div>;
}
