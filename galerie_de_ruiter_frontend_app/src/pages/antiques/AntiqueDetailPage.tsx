import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Badge, Button, Form, Spinner } from "react-bootstrap";
import { ArrowLeft, Heart, ShoppingBag, UserRound } from "lucide-react";
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
import { saveAntiqueReconstruction, getAntiqueReconstructionImages } from "@/apis/backend_api";
import { resolveAntiqueImageUrl } from "@/models/antiques/Antique";

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
  const { t } = useLanguage();
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
  const savedJobIdRef = useRef<string | undefined>(undefined);

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
    const jobBaseUrl = import.meta.env.VITE_RECONSTRUCTION_API_URL ?? "http://localhost:8000";
    // const views = reconstructionJob.image_views.map((view) => ({
    //   position: view.position,
    //   url: `${jobBaseUrl}${view.url}`,
    // }));
    // // Persist so the six views survive a page reload and are visible to every user, not just this browser session.
    // saveAntiqueReconstruction(antique.id, views, reconstructionJob.model_url)
    //   .then(() => {
    //     setReconstructionMessage("Six views saved successfully.");
    //   })
    //   .catch((error) => {
    //     // console.error("Failed to persist reconstruction:", error);
    //     setReconstructionMessage(
    //       "The six views were generated, but could not be saved.",
    //     );
    //   });
  }, [antique, reconstructionJob]);

  if (loading)
    return (
      <div className="catalogue-state">
        <Spinner animation="border" size="sm" /> Loading piece...
      </div>
    );
  if (error || !antique)
    return <Alert variant="warning">{t("pieceNotFound")}</Alert>;

  const artist =
    antique.artist?.displayName ??
    antique.artist?.name ??
    "Galerie de Ruiter collection";


  const price = antique.price == null
      ? "Price on request"
      : `EUR ${antique.price.toLocaleString("en-BE", { minimumFractionDigits: 2 })}`;

  const wishlisted = isWishlisted(antique.id);

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

  const modelUrl = reconstructionJob?.model_url ?? antique.modelUrl;

  const antiqueImageUrls = antique.imageUrls?.length
    ? antique.imageUrls
    : antique.imageUrl
      ? [antique.imageUrl]
      : [];

  const previewImageUrl = selectedImageUrl ?? antiqueImageUrls[0];

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

  const submit = async () => {
    if (positions.some((position) => !modelImages[position])) return;
    setReconstructionMessage("Uploading six views...");
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
          ? "The reconstruction service is disabled."
          : "Reconstruction started.",
      );

      saveAntiqueReconstruction(antique.id, images_to_preview, job.model_url)
        .then(() => {
          setReconstructionMessage("Six views saved successfully.");
        })
        .catch((error) => {
          setReconstructionMessage(
            "The six views were generated, but could not be saved.",
          );
        });
    } catch {
      setReconstructionMessage("The reconstruction job could not be started.");
    }
  };

  return (
    <section className="detail-page">
      <Button
        variant="link"
        className="detail-back"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft size={17} /> {t("backToCollection")}
      </Button>
      <div className="detail-layout">
        <div className="detail-media">
          <div
            className="detail-image"
            aria-label={`Preview of ${antique.title}`}
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
              aria-label="Additional images"
            >
              {antiqueImageUrls.map((imageUrl, index) => (
                <button
                  key={imageUrl}
                  className={
                    previewImageUrl === imageUrl ? "is-selected" : undefined
                  }
                  type="button"
                  onClick={() => setSelectedImageUrl(imageUrl)}
                  aria-label={`Preview ${antique.title}, ${index + 1}`}
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
              "A considered piece with a story still unfolding."}
          </p>
          <div className="model-preview">
            {modelUrl && (
              <iframe title={`3D preview of ${antique.title}`} src={modelUrl} />
            )}
            {!modelUrl && activeImage && (
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
                <span className="cube-view-label">{activeView}</span>
              </div>
            )}
            {!modelUrl && !activeImage && (
              <>
                <span>3D PREVIEW</span>
                <strong>{t("modelComingSoon")}</strong>
                <p>{t("modelDescription")}</p>
              </>
            )}
            {!modelUrl &&
            (viewMap.size > 0 || Object.keys(imagePreviews).length > 0) ? (
              <div className="cube-view-controls">
                {positions.map((position) => (
                  <Button
                    key={position}
                    size="sm"
                    variant={
                      activeView === position ? "dark" : "outline-secondary"
                    }
                    onClick={() => setActiveView(position)}
                  >
                    {position}
                  </Button>
                ))}
              </div>
            ) : null}
          </div>
          {auth.isAdmin && (
            <div className="model-admin-panel">
              <strong>CPU six-view preview</strong>
              <p>
                Upload one image for each named position. Drag the preview to
                switch between directional views; click it to toggle front and
                back.
              </p>
              {positions.map((position) => (
                <div className="position-upload" key={position}>
                  <Form.Label>{position}</Form.Label>
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
              <small>{Object.keys(modelImages).length}/6 views selected.</small>
              <Button
                disabled={
                  positions.some((position) => !modelImages[position]) ||
                  (!!reconstructionJob &&
                    ["queued", "running"].includes(reconstructionJob.status))
                }
                onClick={submit}
              >
                Submit six views
              </Button>
              {reconstructionJob && (
                <small>
                  Status: {reconstructionJob.status}{" "}
                  {reconstructionJob.progress}%
                </small>
              )}
              {reconstructionMessage && <small>{reconstructionMessage}</small>}
            </div>
          )}
          <div className="detail-facts">
            <span>Condition</span>
            <strong>Available to discuss</strong>
            <span>Ownership</span>
            <strong>Galerie de Ruiter</strong>
            <span>Price</span>
            <strong>{price}</strong>
          </div>
          <div className="detail-actions">
            <Button variant="dark" onClick={() => addToCart(antique)}>
              <ShoppingBag size={17} /> {t("addToCart")}
            </Button>
            <Button
              variant={wishlisted ? "danger" : "outline-dark"}
              onClick={() => toggleWishlist(antique)}
            >
              <Heart size={17} fill={wishlisted ? "currentColor" : "none"} />{" "}
              {wishlisted ? t("saved") : t("savePiece")}
            </Button>
          </div>
          <p className="detail-note">
            <UserRound size={16} /> Purchase requests and appointments are
            confirmed personally by the gallery.
          </p>
        </div>
      </div>
    </section>
  );
}
