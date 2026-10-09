import { useTranslation } from "react-i18next";
import { ThreeDScene } from "@/3dmodel/three-d/ThreeDScene";

/**
 * Shows the antique in the 3D canvas. Only GLB/GLTF models are rendered; pieces without
 * a published model show a note, and their photographs come from DetailMedia.
 */
export function DetailPreview({ title, modelUrl }: { title: string; modelUrl?: string }) {
  const { t } = useTranslation();
  if (!modelUrl) return <div className="model-preview">
    <span>{t("threeDPreview")}</span><strong>{t("modelComingSoon")}</strong>
  </div>;
  return <div className="model-preview">
    <div className="three-d-viewer" aria-label={t("model3DAlt", { title })}>
      <ThreeDScene modelUrl={modelUrl} />
    </div>
  </div>;
}

