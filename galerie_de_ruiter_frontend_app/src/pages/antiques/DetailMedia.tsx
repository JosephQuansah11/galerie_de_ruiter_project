import { Button } from "@/components/ReactButton";
import type Antique from "@/models/antiques/Antique";
import { resolveAntiqueImageUrl } from "@/models/antiques/Antique";
import type { Translate } from "./detailTypes";

type Props = { antique: Antique; urls: string[]; preview?: string; select: (url: string) => void; t: Translate };
export function DetailMedia({ antique, urls, preview, select, t }: Props) {
  return <div className="detail-media">
    <div className="detail-image" aria-label={t("previewNamed", { title: antique.title })}>
      {preview ? <img src={resolveAntiqueImageUrl(preview)} alt={antique.title} /> : antique.title.slice(0, 1).toUpperCase()}
    </div>
    {urls.length > 1 && <div className="detail-image-gallery" aria-label={t("additionalImages")}>
      {urls.map((url, index) => <Button key={url} className={preview === url ? "is-selected" : undefined}
        type="button" onClick={() => select(url)} aria-label={t("previewImageNumber", { title: antique.title, number: index + 1 })}>
        <img src={resolveAntiqueImageUrl(url)} alt={`${antique.title}, ${index + 1}`} /></Button>)}
    </div>}
  </div>;
}
