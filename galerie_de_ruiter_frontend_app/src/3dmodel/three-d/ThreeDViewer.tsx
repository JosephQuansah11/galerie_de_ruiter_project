import { useTranslation } from "react-i18next";
import type { ThreeDModelFactory } from "./types";
import { ViewerErrorBoundary } from "./ViewerErrorBoundary";
import { ThreeDScene } from "./ThreeDScene";
import { useWebGLSupport } from "./useWebGLSupport";
import { GlbModelViewer } from "./GlbModelViewer";

export function ThreeDViewer({ title, createModel, modelUrl, frontImageUrl }: {
  title: string; createModel?: ThreeDModelFactory; modelUrl?: string; frontImageUrl?: string;
}) {
  const { t } = useTranslation();
  if (modelUrl) {
    return <div className="three-d-viewer">
      <GlbModelViewer modelUrl={modelUrl} posterUrl={frontImageUrl}
        alt={t("model3DAlt", { title })} loadErrorText={t("model3DLoadFailed")} />
    </div>;
  }
  return <ProceduralThreeDViewer createModel={createModel} frontImageUrl={frontImageUrl} />;
}

function ProceduralThreeDViewer({ createModel, frontImageUrl }: {
  createModel?: ThreeDModelFactory; frontImageUrl?: string;
}) {
  const { t } = useTranslation();
  const supported = useWebGLSupport();
  if (supported === false) return <ViewerMessage>{t("threeDUnavailable")}</ViewerMessage>;
  if (supported === undefined) return <ViewerMessage>{t("preparing3DPreview")}</ViewerMessage>;
  return <div className="three-d-viewer">
    <ViewerErrorBoundary unavailableText={t("threeDUnavailable")}>
      <ThreeDScene createModel={createModel} frontImageUrl={frontImageUrl} />
    </ViewerErrorBoundary>
  </div>;
}

function ViewerMessage({ children }: { children: string }) {
  return <div className="three-d-viewer-fallback" role="status">{children}</div>;
}
