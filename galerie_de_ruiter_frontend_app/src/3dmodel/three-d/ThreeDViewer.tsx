import { useTranslation } from "react-i18next";
import type { ThreeDModelFactory } from "./types";
import { ViewerErrorBoundary } from "./ViewerErrorBoundary";
import { ThreeDScene } from "./ThreeDScene";
import { useWebGLSupport } from "./useWebGLSupport";

export function ThreeDViewer({ createModel, modelUrl, frontImageUrl }: {
  createModel?: ThreeDModelFactory; modelUrl?: string; frontImageUrl?: string;
}) {
  const { t } = useTranslation();
  const supported = useWebGLSupport();
  if (supported === false) return <ViewerMessage>{t("threeDUnavailable")}</ViewerMessage>;
  if (supported === undefined) return <ViewerMessage>{t("preparing3DPreview")}</ViewerMessage>;
  return <div className="three-d-viewer">
    <ViewerErrorBoundary unavailableText={t("threeDUnavailable")}>
      <ThreeDScene createModel={createModel} modelUrl={modelUrl} frontImageUrl={frontImageUrl} />
    </ViewerErrorBoundary>
  </div>;
}

function ViewerMessage({ children }: { children: string }) {
  return <div className="three-d-viewer-fallback" role="status">{children}</div>;
}
