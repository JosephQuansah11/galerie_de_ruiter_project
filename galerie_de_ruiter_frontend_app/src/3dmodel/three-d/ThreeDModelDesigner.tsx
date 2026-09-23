// src/components/three-d/ThreeDModelDesigner.tsx

import { useEffect, useState } from "react";

import type { ThreeDModelFactory } from "./types";
import { ThreeDViewer } from "./ThreeDViewer";

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
        Upload a front image to create the 3D model.
      </div>
    );
  }

  if (!createModel && !modelUrl) {
    return (
      <div className="alert alert-warning">
        No 3D model has been generated yet.
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