import { useRef } from "react";
import { Button } from "@/components/ReactButton";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type Antique from "@/models/antiques/Antique";
import type { Translate } from "./detailTypes";
import { RelatedItem } from "./RelatedItem";

export function RelatedCollection({ antiques, locale, t, select }: { antiques: Antique[]; locale: string;
  t: Translate; select: (id: string) => void }) {
  const track = useRef<HTMLDivElement>(null);
  const scroll = (direction: -1 | 1) => track.current?.scrollBy({ left: direction * track.current.clientWidth * 0.8, behavior: "smooth" });
  return <section className="detail-related" aria-labelledby="detail-related-title">
    <div className="detail-related-heading"><div><span className="catalogue-artist">{t("detailRelatedEyebrow")}</span>
      <h2 id="detail-related-title">{t("detailRelatedTitle")}</h2></div>
      <div className="detail-related-controls"><Button type="button" aria-label={t("scrollCollectionLeft")} onClick={() => scroll(-1)}><ChevronLeft size={20} /></Button>
        <Button type="button" aria-label={t("scrollCollectionRight")} onClick={() => scroll(1)}><ChevronRight size={20} /></Button></div>
    </div>
    <div className="detail-related-track" ref={track} role="region" aria-label={t("morePiecesFromCollection")}>
      {antiques.map((item) => <RelatedItem key={item.id} antique={item} locale={locale} t={t} select={select} />)}
    </div>
  </section>;
}
