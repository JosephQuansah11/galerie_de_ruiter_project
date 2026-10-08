// src/components/three-d/ThreeDModelDesigner.tsx

import type { ThreeDModelFactory } from "./types";
import { ThreeDViewer } from "./ThreeDViewer";
import { useTranslation } from "react-i18next";
import { useModelPreviewUrl } from "./useModelPreviewUrl";

interface ThreeDModelDesignerProps {
  title: string;
  frontImage?: File | string;
  modelUrl?: string;
  createModel?: ThreeDModelFactory;
}

export function ThreeDModelDesigner({
  title,
  frontImage,
  modelUrl,
  createModel,
}: ThreeDModelDesignerProps) {
  const { t } = useTranslation();
  const previewUrl = useModelPreviewUrl(frontImage);

  if (!frontImage && !modelUrl) {
    return (
      <div className="alert alert-info">
        {t("uploadFrontImage")}
      </div>
    );
  }

  if (!createModel && !modelUrl) {
    return (
      <div className="alert alert-warning">
        {t("no3DModelYet")}
      </div>
    );
  }

  return (
    <div className="three-d-model-designer">

      <ThreeDViewer
        title={title}
        createModel={createModel}
        modelUrl={modelUrl}
        frontImageUrl={previewUrl}
      />

    </div>
  );
}