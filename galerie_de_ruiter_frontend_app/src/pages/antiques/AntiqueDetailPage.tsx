import { useEffect, useMemo, useState } from "react";
import { Alert, Spinner } from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";
import { useAntiqueContent } from "@/hooks/useAddAntiques";
import { useShopping } from "@/context/ShoppingContext";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { AntiqueDetailContent } from "./AntiqueDetailContent";
import { useDetailImages } from "./useDetailImages";
import { useDetailGestures } from "./useDetailGestures";
import { useReconstructionJob } from "./useReconstructionJob";
import { useSaveReconstruction } from "./useSaveReconstruction";
import { getDetailPresentation } from "./useDetailPresentation";
import type { Position } from "./detailTypes";

export default function AntiqueDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { antiques, loading, error } = useAntiqueContent();
  const { addToCart, toggleWishlist, isWishlisted } = useShopping();
  const auth = useAuth();
  const { t, locale } = useLanguage();
  const antique = useMemo(() => antiques.find((item) => item.id === id), [antiques, id]);
  const [selectedImage, setSelectedImage] = useState<string>();
  const images = useDetailImages();
  const gestures = useDetailGestures();
  const reconstruction = useReconstructionJob(antique?.id ?? "", images.images);
  useSaveReconstruction(antique, images.images, reconstruction.job, reconstruction.setMessage);
  useEffect(() => setSelectedImage(undefined), [id]);
  if (loading) return <div className="catalogue-state"><Spinner animation="border" size="sm" /> {t("loadingPiece")}</div>;
  if (error || !antique) return <Alert variant="warning">{t("pieceNotFound")}</Alert>;
  const data = getDetailPresentation(antique, antiques, locale, selectedImage, images.images,
    images.previews, gestures.activeView, reconstruction.job, t);
  const inProgress = ["queued", "running"].includes(reconstruction.job?.status ?? "");
  const allSelected = (["front", "back", "left", "right", "top", "bottom"] as Position[]).every((position) => images.images[position]);
  return <AntiqueDetailContent antique={antique} images={data.imageUrls} selectedImage={data.preview}
    selectImageUrl={setSelectedImage} artist={data.artist} price={data.price}
    wishlisted={isWishlisted(antique.id)} addToCart={() => addToCart(antique)}
    toggleWishlist={() => toggleWishlist(antique)} modelUrl={data.modelUrl} frontImage={data.frontImage}
    activeImage={data.activeImage} activeView={gestures.activeView}
    viewsAvailable={data.views.size > 0 || Object.keys(images.previews).length > 0}
    startDrag={gestures.startDrag} endDrag={gestures.endDrag} selectView={gestures.setActiveView}
    isAdmin={auth.isAdmin} modelImages={images.images} job={reconstruction.job}
    reconstructionMessage={reconstruction.message} submitDisabled={!allSelected || inProgress}
    selectModelImage={images.selectImage} submitReconstruction={() => void reconstruction.submit()}
    related={data.related} locale={locale} back={() => navigate(-1)}
    openAntique={(itemId) => navigate(`/antiques/${itemId}`)} t={t} />;
}
