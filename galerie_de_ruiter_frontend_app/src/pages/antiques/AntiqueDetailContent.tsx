import { Button } from "@/components/ReactButton";
import { ArrowLeft } from "lucide-react";
import type Antique from "@/models/antiques/Antique";
import type { ReconstructionJob } from "@/apis/reconstruction_api";
import type { Position, Translate } from "./detailTypes";
import { DetailMedia } from "./DetailMedia";
import { DetailPreview } from "./DetailPreview";
import { DetailSummary } from "./DetailSummary";
import { ReconstructionPanel } from "./ReconstructionPanel";
import { RelatedCollection } from "./RelatedCollection";

type Props = { antique: Antique; images: string[]; selectedImage?: string; selectImageUrl: (url: string) => void;
  artist: string; price: string; wishlisted: boolean; addToCart: () => void; toggleWishlist: () => void;
  modelUrl?: string; frontImage?: string | File; activeImage?: string; activeView: Position; viewsAvailable: boolean;
  startDrag: React.PointerEventHandler; endDrag: React.PointerEventHandler; selectView: (position: Position) => void;
  isAdmin: boolean; modelImages: Partial<Record<Position, File>>; job?: ReconstructionJob;
  reconstructionMessage: string; submitDisabled: boolean; selectModelImage: (position: Position, file?: File) => void;
  submitReconstruction: () => void; related: Antique[]; locale: string; back: () => void; openAntique: (id: string) => void; t: Translate };

export function AntiqueDetailContent(props: Props) {
  const { antique, t } = props;
  return <section className="detail-page">
    <Button type="button" className="detail-back" onClick={props.back}><ArrowLeft size={17} /> {t("backToCollection")}</Button>
    <div className="detail-banner"><div><span>{t("galleryName")}</span><p>{t("detailBannerMotto")}</p></div>
      <span className="detail-banner-caption">{t("detailBannerCategories")}</span></div>
    <div className="detail-layout"><DetailMedia antique={antique} urls={props.images} preview={props.selectedImage} select={props.selectImageUrl} t={t} />
      <div className="detail-copy"><DetailSummary antique={antique} artist={props.artist} price={props.price}
        wishlisted={props.wishlisted} addToCart={props.addToCart} toggleWishlist={props.toggleWishlist} t={t} />
        <DetailPreview title={antique.title} modelUrl={props.modelUrl} frontImage={props.frontImage}
          activeImage={props.activeImage} activeView={props.activeView} viewsAvailable={props.viewsAvailable}
          positions={["front", "back", "left", "right", "top", "bottom"]} startDrag={props.startDrag}
          endDrag={props.endDrag} selectView={props.selectView} t={t} />
        {props.isAdmin && <ReconstructionPanel images={props.modelImages} job={props.job}
          message={props.reconstructionMessage} disabled={props.submitDisabled} select={props.selectModelImage}
          submit={props.submitReconstruction} t={t} />}
      </div>
    </div>
    {props.related.length > 0 && <RelatedCollection antiques={props.related} locale={props.locale} t={t} select={props.openAntique} />}
  </section>;
}
