import { lazy, Suspense } from "react";
import { useTranslation } from "react-i18next";

/**
 * three.js and its renderer are most of a megabyte of JavaScript that only a piece with a
 * published model needs, so the viewer is fetched on demand instead of with the first paint.
 */
const ThreeDScene = lazy(() => import("@/3dmodel/three-d/ThreeDScene")
  .then((module) => ({ default: module.ThreeDScene })));

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
      <Suspense fallback={<div className="three-d-viewer-loading" role="status">{t("preparing3DPreview")}</div>}>
        <ThreeDScene modelUrl={modelUrl} />
      </Suspense>
    </div>
  </div>;
}

