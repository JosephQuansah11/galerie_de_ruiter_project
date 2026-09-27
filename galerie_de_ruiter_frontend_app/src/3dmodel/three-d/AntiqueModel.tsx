// src/components/three-d/AntiqueModel.tsx

import { useMemo } from "react";
import type * as THREE from "three";
import type { ThreeDModelFactory } from "./types";

interface AntiqueModelProps {
  createModel: ThreeDModelFactory;
  frontImageUrl?: string;
}

export function AntiqueModel({
  createModel,
  frontImageUrl,
}: AntiqueModelProps) {
  const model = useMemo<THREE.Group>(
    () => createModel(frontImageUrl),
    [createModel, frontImageUrl]
  );

  return (
    <primitive
      object={model}
      dispose={null}
    />
  );
}