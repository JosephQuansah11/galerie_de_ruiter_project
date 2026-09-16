import { useMemo } from "react";
import { Alert, Badge, Button, Spinner } from "react-bootstrap";
import { ArrowLeft, Heart, ShoppingBag, UserRound } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useAntiqueContent } from "@/hooks/useAddAntiques";
import { useShopping } from "@/context/ShoppingContext";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";

export default function AntiqueDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { antiques, loading, error } = useAntiqueContent();
  const { addToCart, toggleWishlist, isWishlisted } = useShopping();
  const auth = useAuth();
  const { t } = useLanguage();
  const antique = useMemo(() => antiques.find((item) => item.id === id), [antiques, id]);

  if (loading) return <div className="catalogue-state"><Spinner animation="border" size="sm" /> Loading piece...</div>;
  if (error || !antique) return <Alert variant="warning">{t("pieceNotFound")}</Alert>;

  const artist = antique.artist?.displayName ?? antique.artist?.name ?? "Galerie de Ruiter collection";
  const price = antique.price == null ? "Price on request" : `EUR ${antique.price.toLocaleString("en-BE", { minimumFractionDigits: 2 })}`;
  const wishlisted = isWishlisted(antique.id);

  return (
    <section className="detail-page">
      <Button variant="link" className="detail-back" onClick={() => navigate(-1)}><ArrowLeft size={17} /> {t("backToCollection")}</Button>
      <div className="detail-layout">
        <div className="detail-image" aria-label={`Preview of ${antique.title}`}>{antique.imageUrl ? <img src={`${import.meta.env.VITE_JAVA_BACKEND_URL ?? "http://localhost:8080"}${antique.imageUrl}`} alt={antique.title} /> : antique.title.slice(0, 1).toUpperCase()}</div>
        <div className="detail-copy">
          <Badge bg="dark" className="catalogue-kicker">OBJECT  /  {antique.id.slice(0, 8)}</Badge>
          <span className="catalogue-artist">{artist}</span>
          <h1>{antique.title}</h1>
          <p className="detail-description">{antique.description || "A considered piece with a story still unfolding."}</p>
          <div className="model-preview">
            {antique.modelUrl ? <iframe title={`3D preview of ${antique.title}`} src={antique.modelUrl} /> : <><span>3D PREVIEW</span><strong>{t("modelComingSoon")}</strong><p>{t("modelDescription")}</p></>}
          </div>
          {auth.isAdmin && <div className="model-admin-panel"><strong>MeshGPT image-to-3D</strong><p>Generate the model in the MeshGPT playground, then paste the exported model URL into the antique edit workflow.</p><a className="btn btn-outline-dark" href="https://meshgpt.io/image-to-3d/#app-playground" target="_blank" rel="noreferrer">Open MeshGPT designer</a><a className="model-tutorial-link" href="https://youtu.be/xMNUm2Q3M28" target="_blank" rel="noreferrer">View workflow example</a></div>}
          <div className="detail-facts"><span>Condition</span><strong>Available to discuss</strong><span>Ownership</span><strong>Galerie de Ruiter</strong><span>Price</span><strong>{price}</strong></div>
          <div className="detail-actions">
            <Button variant="dark" onClick={() => addToCart(antique)}><ShoppingBag size={17} /> {t("addToCart")}</Button>
            <Button variant={wishlisted ? "danger" : "outline-dark"} onClick={() => toggleWishlist(antique)}><Heart size={17} fill={wishlisted ? "currentColor" : "none"} /> {wishlisted ? t("saved") : t("savePiece")}</Button>
          </div>
          <p className="detail-note"><UserRound size={16} /> Purchase requests and appointments are confirmed personally by the gallery.</p>
        </div>
      </div>
    </section>
  );
}