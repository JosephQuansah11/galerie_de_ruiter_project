import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Badge, Button, Form, Spinner } from "react-bootstrap";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Heart,
  ShoppingBag,
  UserRound,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useAntiqueContent } from "@/hooks/useAddAntiques";
import { useShopping } from "@/context/ShoppingContext";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import {
  createReconstructionJob,
  getReconstructionJob,
  type ReconstructionJob,
} from "@/apis/reconstruction_api";
import {
  saveAntiqueReconstruction,
  // getAntiqueReconstructionImages,
} from "@/apis/backend_api";
import { resolveAntiqueImageUrl } from "@/models/antiques/Antique";
import { ThreeDModelDesigner } from "@/3dmodel/three-d/ThreeDModelDesigner";
import { createAntiqueModel } from "@/3dmodel/three-d/generated/createAntiqueModel";
import { formatEuroAmount } from "@/i18n";
import { publishContentUpdate } from "@/services/contentUpdates";

type Position = "front" | "back" | "left" | "right" | "top" | "bottom";
const positions: Position[] = [
  "front",
  "back",
  "left",
  "right",
  "top",
  "bottom",
];

export default function AntiqueDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { antiques, loading, error } = useAntiqueContent();
  const { addToCart, toggleWishlist, isWishlisted } = useShopping();
  const auth = useAuth();
  const { t, locale } = useLanguage();
  const antique = useMemo(
    () => antiques.find((item) => item.id === id),
    [antiques, id],
  );
  const [modelImages, setModelImages] = useState<
    Partial<Record<Position, File>>
  >({});
  const [imagePreviews, setImagePreviews] = useState<
    Partial<Record<Position, string>>
  >({});
  const [reconstructionJob, setReconstructionJob] =
  useState<ReconstructionJob>();
  const [reconstructionMessage, setReconstructionMessage] = useState("");
  const [activeView, setActiveView] = useState<Position>("front");
  const [selectedImageUrl, setSelectedImageUrl] = useState<string>();
  const dragStart = useRef<{ x: number; y: number } | undefined>(undefined);
  const relatedTrackRef = useRef<HTMLDivElement>(null);
  // const jobBaseUrl =
  //   import.meta.env.VITE_RECONSTRUCTION_API_URL ?? "http://localhost:8000";
  const savedJobIdRef = useRef<string | undefined>(undefined);
  const handleBackClick = () => {
    navigate(-1);
  };

  useEffect(
    () => () =>
      Object.values(imagePreviews).forEach(
        (preview) => preview && URL.revokeObjectURL(preview),
      ),
    [imagePreviews],
  );
  useEffect(() => {
    setSelectedImageUrl(undefined);
  }, [antique?.id]);
  useEffect(() => {
    if (
      !reconstructionJob ||
      !["queued", "running"].includes(reconstructionJob.status)
    )
      return;
    const timer = window.setInterval(async () => {
      try {
        setReconstructionJob(
          await getReconstructionJob(reconstructionJob.job_id),
        );
      } catch {
        /* preserve current state */
      }
    }, 3000);
    return () => window.clearInterval(timer);
  }, [reconstructionJob]);
  useEffect(() => {
    if (
      !antique ||
      reconstructionJob?.status !== "completed" ||
      !reconstructionJob.image_views?.length ||
      savedJobIdRef.current === reconstructionJob.job_id
    )
      return;
    savedJobIdRef.current = reconstructionJob.job_id;
    // const views = reconstructionJob.image_views.map((view) => ({
    //   position: view.position,
    //   url: `${jobBaseUrl}${view.url}`,
    // }));
    // // Persist so the six views survive a page reload and are visible to every user, not just this browser session.
    // saveAntiqueReconstruction(antique.id, views, reconstructionJob.model_url)
    //   .then(() => {
    //     setReconstructionMessage("Six views saved successfully.");
    //   })
    //   .catch(() => {
    //     setReconstructionMessage(
    //       "The six views were generated, but could not be saved.",
    //     );
    //   });
  }, [antique, reconstructionJob]);

  if (loading)
    return (
      <div className="catalogue-state">
        <Spinner animation="border" size="sm" /> {t("loadingPiece")}
      </div>
    );
  if (error || !antique)
    return <Alert variant="warning">{t("pieceNotFound")}</Alert>;

  const artist =
    antique.artist?.displayName ??
    antique.artist?.name ??
    t("galerieDeRuiterCollection");

  const price =
    antique.price == null
      ? t("priceOnRequest")
      : formatEuroAmount(antique.price, locale);

  const wishlisted = isWishlisted(antique.id);
  const relatedAntiques = antiques
    .filter((item) => item.id !== antique.id)
    .sort((first, second) => {
      const firstMatches = first.category === antique.category;
      const secondMatches = second.category === antique.category;
      return Number(secondMatches) - Number(firstMatches);
    });
  const wishlistButtonVariant: "danger" | "outline-dark" = wishlisted
    ? "danger"
    : "outline-dark";

  const baseUrl =
    import.meta.env.VITE_RECONSTRUCTION_API_URL ?? "http://localhost:8000";
  const viewMap = new Map<Position, string>();

  (antique.sixViewImages ?? []).forEach((view) =>
    viewMap.set(view.position as Position, view.url),
  );

  (reconstructionJob?.image_views ?? []).forEach((view) =>
    viewMap.set(view.position as Position, `${baseUrl}${view.url}`),
  );

  const activeImage = viewMap.get(activeView) ?? imagePreviews[activeView];

  const reconstructionInProgress =
    reconstructionJob?.status === "queued" ||
    reconstructionJob?.status === "running";
  const reconstructionStatusKeys: Record<string, string> = {
    queued: "reconstructionStatusQueued",
    running: "reconstructionStatusRunning",
    completed: "reconstructionStatusCompleted",
    failed: "reconstructionStatusFailed",
    processing_disabled: "reconstructionStatusProcessingDisabled",
  };
  const allViewsSelected: boolean = positions.every(
    (position) => modelImages[position] !== undefined,
  );
  const submitDisabled: boolean =
    !allViewsSelected || reconstructionInProgress;

  let antiqueImageUrls: string[] = [];
  if (antique.imageUrls?.length) {
    antiqueImageUrls = antique.imageUrls;
  } else if (antique.imageUrl) {
    antiqueImageUrls = [antique.imageUrl];
  }

  const previewImageUrl = selectedImageUrl ?? antiqueImageUrls[0];
  const modelSource = reconstructionJob?.model_url ?? antique.modelUrl;
  const modelSourceUrl = modelSource?.startsWith("http")
    ? modelSource
    : modelSource
      ? `${baseUrl}${modelSource}`
      : undefined;
  const frontImageSource =
    modelImages.front ??
    (previewImageUrl ? resolveAntiqueImageUrl(previewImageUrl) : undefined) ??
    activeImage;
  const hasThreeDPreview = Boolean(modelSourceUrl || frontImageSource);

  const selectImage = (position: Position, file?: File) => {
    if (!file) return;
    setModelImages((current) => ({ ...current, [position]: file }));
    setImagePreviews((current) => {
      const oldPreview = current[position];

      if (oldPreview) {
        URL.revokeObjectURL(oldPreview);
      }

      return {
        ...current,
        [position]: URL.createObjectURL(file),
      };
    });
  };

  const startDrag = (event: React.PointerEvent) => {
    dragStart.current = { x: event.clientX, y: event.clientY };
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  };

  const endDrag = (event: React.PointerEvent) => {
    if (!dragStart.current) return;
    const dx = event.clientX - dragStart.current.x;
    const dy = event.clientY - dragStart.current.y;
    dragStart.current = undefined;
    if (Math.abs(dx) < 12 && Math.abs(dy) < 12) {
      setActiveView((current) => {
        if (current === "front") return "back";
        if (current === "back") return "front";
        return current;
      });
    } else if (Math.abs(dx) > Math.abs(dy)) {
      setActiveView(dx > 0 ? "left" : "right");
    } else {
      setActiveView(dy > 0 ? "bottom" : "top");
    }
  };

  const handleViewChange = (position: Position): void => {
    setActiveView(position);
  };

  const submit = async (): Promise<void> => {
    if (!allViewsSelected) return;
    setReconstructionMessage("uploadingSixViews");
    try {
      const images_to_preview = positions.map((position) => ({
        position,
        image_data: modelImages[position]!,
      }));
      const job = await createReconstructionJob(
        antique.id,
        positions.map((position) => ({
          position,
          file: modelImages[position]!,
        })),
      );

      setReconstructionJob(job);
      setReconstructionMessage(
        job.status === "processing_disabled"
          ? "reconstructionDisabled"
          : "reconstructionStarted",
      );

      saveAntiqueReconstruction(antique.id, images_to_preview, job.model_url)
        .then(() => {
          setReconstructionMessage("sixViewsSaved");
          publishContentUpdate("antiques");
        })
        .catch(() => {
          setReconstructionMessage(
            "sixViewsNotSaved",
          );
        });
    } catch {
      setReconstructionMessage("reconstructionFailed");
    }
  };

  const handleSubmit = (): void => {
    void submit();
  };

  const handleAddToCart = (): void => {
    addToCart(antique);
  };

  const handleWishlistToggle = (): void => {
    toggleWishlist(antique);
  };

  const scrollRelated = (direction: -1 | 1): void => {
    relatedTrackRef.current?.scrollBy({
      left: direction * relatedTrackRef.current.clientWidth * 0.8,
      behavior: "smooth",
    });
  };

  return (
    <section className="detail-page">
      <button
        type="button"
        className="detail-back"
        onClick={handleBackClick}
      >
        <ArrowLeft size={17} /> {t("backToCollection")}
      </button>
      <div className="detail-banner">
        <div>
          <span>{t("galleryName")}</span>
          <p>{t("detailBannerMotto")}</p>
        </div>
        <span className="detail-banner-caption">{t("detailBannerCategories")}</span>
      </div>
      <div className="detail-layout">
        <div className="detail-media">
          <div
            className="detail-image"
            aria-label={t("previewNamed", { title: antique.title })}
          >
            {previewImageUrl ? (
              <img
                src={resolveAntiqueImageUrl(previewImageUrl)}
                alt={antique.title}
              />
            ) : (
              antique.title.slice(0, 1).toUpperCase()
            )}
          </div>
          {antiqueImageUrls.length > 1 && (
            <div
              className="detail-image-gallery"
              aria-label={t("additionalImages")}
            >
              {antiqueImageUrls.map((imageUrl, index) => (
                <button
                  key={imageUrl}
                  className={
                    previewImageUrl === imageUrl ? "is-selected" : undefined
                  }
                  type="button"
                  onClick={() => setSelectedImageUrl(imageUrl)}
                  aria-label={t("previewImageNumber", { title: antique.title, number: index + 1 })}
                >
                  <img
                    src={resolveAntiqueImageUrl(imageUrl)}
                    alt={`${antique.title}, ${index + 1}`}
                  />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="detail-copy">
          <Badge bg="dark" className="catalogue-kicker">
            OBJECT / {antique.id.slice(0, 8)}
          </Badge>
          <span className="catalogue-artist">{artist}</span>
          <h1>{antique.title}</h1>
          <p className="detail-description">
            {antique.description ||
              t("consideredPiece")}
          </p>
          <div className="model-preview">
            {hasThreeDPreview && (
              <ThreeDModelDesigner
                frontImage={frontImageSource}
                modelUrl={modelSourceUrl}
                createModel={createAntiqueModel}
              />
            )}
            {!hasThreeDPreview && activeImage && (
              <div
                className="image-cube-viewer"
                onPointerDown={startDrag}
                onPointerUp={endDrag}
              >
                <img
                  className="cube-active-image"
                  src={activeImage}
                  alt={`${activeView} view of ${antique.title}`}
                />
                <span className="cube-view-label">{t(`position${activeView[0].toUpperCase()}${activeView.slice(1)}`)}</span>
              </div>
            )}
            {!hasThreeDPreview && !activeImage && (
              <>
                <span>{t("threeDPreview")}</span>
                <strong>{t("modelComingSoon")}</strong>
                <p>{t("modelDescription")}</p>
              </>
            )}
            {!hasThreeDPreview &&
            (viewMap.size > 0 || Object.keys(imagePreviews).length > 0) ? (
              <div className="cube-view-controls">
                {positions.map((position) => {
                  const variant: "dark" | "outline-secondary" =
                    activeView === position ? "dark" : "outline-secondary";

                  return (
                    <button
                    type="button"
                      key={position}
                      className={`btn btn-${variant}`}
                      onClick={() => handleViewChange(position)}
                    >
                      {t(`position${position[0].toUpperCase()}${position.slice(1)}`)}
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
          {auth.isAdmin && (
            <div className="model-admin-panel">
              <strong>{t("cpuSixView")}</strong>
              <p>{t("sixViewInstructions")}</p>
              {positions.map((position) => (
                <div className="position-upload" key={position}>
                  <Form.Label>{t(`position${position[0].toUpperCase()}${position.slice(1)}`)}</Form.Label>
                  <Form.Control
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/jpg"
                    onChange={(event) => {
                      selectImage(
                        position,
                        (event.currentTarget as HTMLInputElement).files?.[0],
                      );
                      // images_to_preview.push((event.currentTarget as HTMLInputElement).files?.[0]);
                    }}
                  />
                </div>
              ))}
              <small>{Object.keys(modelImages).length}/6 {t("viewsSelected")}</small>
              <button
                disabled={submitDisabled}
                onClick={handleSubmit}
              >
                {t("submitSixViews")}
              </button>
              {reconstructionJob && (
                <small>
                  {t("status")}: {t(reconstructionStatusKeys[reconstructionJob.status] ?? reconstructionJob.status, { defaultValue: reconstructionJob.status })}{" "}
                  {reconstructionJob.progress}%
                </small>
              )}
              {reconstructionMessage && <small>{t(reconstructionMessage)}</small>}
            </div>
          )}
          <div className="detail-facts">
            <span>{t("condition")}</span>
            <strong>{t("availableToDiscuss")}</strong>
            <span>{t("ownership")}</span>
            <strong>{t("galerieDeRuiter")}</strong>
            <span>{t("price")}</span>
            <strong>{price}</strong>
          </div>
          <div className="detail-actions">
            <button
              type="button"
              className="btn btn-dark"
              onClick={handleAddToCart}
            >
              <ShoppingBag size={17} /> {t("addToCart")}
            </button>
            <button
              type="button"
              className={`btn btn-${wishlistButtonVariant}`}
              onClick={handleWishlistToggle}
            >
              <Heart size={17} fill={wishlisted ? "currentColor" : "none"} />{" "}
              {wishlisted ? t("saved") : t("savePiece")}
            </button>
          </div>
          <p className="detail-note">
            <UserRound size={16} /> {t("purchaseNote")}
          </p>
        </div>
      </div>
      {relatedAntiques.length > 0 && (
        <section
          className="detail-related"
          aria-labelledby="detail-related-title"
        >
          <div className="detail-related-heading">
            <div>
              <span className="catalogue-artist">
                {t("detailRelatedEyebrow")}
              </span>
              <h2 id="detail-related-title">{t("detailRelatedTitle")}</h2>
            </div>
            <div className="detail-related-controls">
              <button
                type="button"
                aria-label={t("scrollCollectionLeft")}
                onClick={() => scrollRelated(-1)}
              >
                <ChevronLeft size={20} />
              </button>
              <button
                type="button"
                aria-label={t("scrollCollectionRight")}
                onClick={() => scrollRelated(1)}
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
          <div
            className="detail-related-track"
            ref={relatedTrackRef}
            role="region"
            aria-label={t("morePiecesFromCollection")}
          >
            {relatedAntiques.map((item) => {
              const itemImage = item.imageUrls?.[0] ?? item.imageUrl;
              return (
                <button
                  className="detail-related-item"
                  key={item.id}
                  type="button"
                  onClick={() => navigate(`/antiques/${item.id}`)}
                >
                  <span className="detail-related-image">
                    {itemImage ? (
                      <img
                        src={resolveAntiqueImageUrl(itemImage)}
                        alt=""
                        loading="lazy"
                      />
                    ) : (
                      item.title.slice(0, 1).toUpperCase()
                    )}
                  </span>
                  <span className="detail-related-name">{item.title}</span>
                  <span className="detail-related-price">
                    {item.price == null
                      ? t("priceOnRequest")
                      : formatEuroAmount(item.price, locale)}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}
    </section>
  );
}
