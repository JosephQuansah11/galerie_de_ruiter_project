import { useEffect, useMemo, useState } from "react";
import { Alert, Spinner } from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";
import { useAntiqueContent } from "@/hooks/useAddAntiques";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useShopping } from "@/context/ShoppingContext";
import { useLanguage } from "@/context/LanguageContext";
import { resolveAntiqueLargeUrl } from "@/models/antiques/Antique";
import { AntiqueDetailContent } from "./AntiqueDetailContent";
import { getDetailPresentation } from "./useDetailPresentation";
import { summarizeDescription } from "./summarizeDescription";

/** Roughly what a search result shows of a description before it is cut off. */
const META_DESCRIPTION_WORDS = 22;

export default function AntiqueDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { antiques, loading, error } = useAntiqueContent();
  const { addToCart, toggleWishlist, isWishlisted } = useShopping();
  const { t, locale } = useLanguage();
  const antique = useMemo(() => antiques.find((item) => item.id === id), [antiques, id]);
  const [selectedImage, setSelectedImage] = useState<string>();
  useEffect(() => setSelectedImage(undefined), [id]);
  // The piece's own story becomes the description a search result shows; a piece that has none
  // yet falls back to the gallery's wording. Both wait until the collection has loaded.
  usePageMeta({
    title: antique ? t("metaPieceTitle", { title: antique.title }) : undefined,
    description: antique
      ? summarizeDescription(antique.description, META_DESCRIPTION_WORDS) || t("metaPieceDescription", { title: antique.title })
      : undefined,
    canonicalPath: `/antiques/${id}`,
    // The representative image is the same 1600-pixel copy the page draws, so a shared link and
    // an image search result both lead back to this piece rather than to the gallery logo.
    image: antique ? resolveAntiqueLargeUrl(antique.imageUrl ?? antique.imageUrls?.[0]) : undefined,
    imageAlt: antique?.title,
    // A stale or mistyped piece URL is a soft 404: the application cannot return a 404 status for
    // a client-side route, so it tells a crawler not to index the "not found" answer instead.
    noindex: !loading && !antique,
  });
  if (loading) return <div className="catalogue-state"><Spinner animation="border" size="sm" /> {t("loadingPiece")}</div>;
  if (error || !antique) return <Alert variant="warning">{t("pieceNotFound")}</Alert>;
  const data = getDetailPresentation(antique, antiques, locale, selectedImage, t);
  return <AntiqueDetailContent antique={antique} images={data.imageUrls} selectedImage={data.preview}
    selectImageUrl={setSelectedImage} artist={data.artist} price={data.price}
    wishlisted={isWishlisted(antique.id)} addToCart={() => addToCart(antique)}
    toggleWishlist={() => toggleWishlist(antique)} modelUrl={data.modelUrl}
    related={data.related} locale={locale} back={() => navigate(-1)}
    openAntique={(itemId) => navigate(`/antiques/${itemId}`)} t={t} />;
}

