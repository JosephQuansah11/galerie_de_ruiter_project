// src/components/three-d/ThreeDModelDesigner.tsx

import { useEffect, useState } from "react";

import type { ThreeDModelFactory } from "./types";
import { ThreeDViewer } from "./ThreeDViewer";
import { useTranslation } from "react-i18next";

interface ThreeDModelDesignerProps {
  frontImage?: File | string;
  modelUrl?: string;
  createModel?: ThreeDModelFactory;
}

export function ThreeDModelDesigner({
  frontImage,
  modelUrl,
  createModel,
}: ThreeDModelDesignerProps) {
  const { t } = useTranslation();
  const [previewUrl, setPreviewUrl] = useState<string>();

  useEffect(() => {
    if (!frontImage) {
      setPreviewUrl(undefined);
      return;
    }

    if (typeof frontImage !== "string") {
      const imageFile = frontImage;
      const url = URL.createObjectURL(imageFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }

    setPreviewUrl(frontImage);
  }, [frontImage, modelUrl]);

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
        createModel={createModel}
        modelUrl={modelUrl}
        frontImageUrl={previewUrl}
      />

    </div>
  );
}