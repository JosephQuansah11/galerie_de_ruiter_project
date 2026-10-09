import { useEffect, useMemo, useState } from "react";
import { Alert, Spinner } from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";
import { useAntiqueContent } from "@/hooks/useAddAntiques";
import { useShopping } from "@/context/ShoppingContext";
import { useLanguage } from "@/context/LanguageContext";
import { AntiqueDetailContent } from "./AntiqueDetailContent";
import { getDetailPresentation } from "./useDetailPresentation";

export default function AntiqueDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { antiques, loading, error } = useAntiqueContent();
  const { addToCart, toggleWishlist, isWishlisted } = useShopping();
  const { t, locale } = useLanguage();
  const antique = useMemo(() => antiques.find((item) => item.id === id), [antiques, id]);
  const [selectedImage, setSelectedImage] = useState<string>();
  useEffect(() => setSelectedImage(undefined), [id]);
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

