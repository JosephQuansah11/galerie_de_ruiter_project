// src/components/three-d/ThreeDViewer.tsx

import {
  Component,
  Suspense,
  useEffect,
  useState,
  type ReactElement,
} from "react";
import { Canvas } from "@react-three/fiber";
import {
  Center,
  ContactShadows,
  Environment,
  OrbitControls,
  useGLTF,
} from "@react-three/drei";

import type { ThreeDModelFactory } from "./types";
import { AntiqueModel } from "./AntiqueModel";

interface ThreeDViewerProps {
  createModel?: ThreeDModelFactory;
  modelUrl?: string;
  frontImageUrl?: string;
}

function LoadingModel() {
  return (
    <mesh>
      <sphereGeometry args={[0.15, 16, 16]} />
      <meshStandardMaterial />
    </mesh>
  );
}

function LoadedModel({ modelUrl }: { modelUrl: string }) {
  const { scene } = useGLTF(modelUrl);
  return <primitive object={scene} dispose={null} />;
}

interface ViewerErrorBoundaryProps {
  children: ReactElement;
}

interface ViewerErrorBoundaryState {
  hasError: boolean;
}

class ViewerErrorBoundary extends Component<
  ViewerErrorBoundaryProps,
  ViewerErrorBoundaryState
> {
  state: ViewerErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ViewerErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="three-d-viewer-fallback" role="status">
          3D preview is unavailable in this browser.
        </div>
      );
    }

    return this.props.children;
  }
}

function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      canvas.getContext("webgl2") ?? canvas.getContext("webgl"),
    );
  } catch {
    return false;
  }
}

export function ThreeDViewer({
  createModel,
  modelUrl,
  frontImageUrl,
}: ThreeDViewerProps) {
  const [webGLSupported, setWebGLSupported] = useState<boolean>();

  useEffect(() => {
    setWebGLSupported(supportsWebGL());
  }, []);

  if (webGLSupported === false) {
    return (
      <div className="three-d-viewer-fallback" role="status">
        3D preview is unavailable in this browser.
      </div>
    );
  }

  if (webGLSupported === undefined) {
    return (
      <div className="three-d-viewer-fallback" role="status">
        Preparing 3D preview...
      </div>
    );
  }

  return (
    <div className="three-d-viewer">
      <ViewerErrorBoundary>
        <Canvas
          camera={{
            position: [2.5, 2, 4],
            fov: 45,
            near: 0.01,
            far: 1000,
          }}
          dpr={[1, 2]}
        >
          <color attach="background" args={["#f4f1eb"]} />
          <ambientLight intensity={0.7} />
          <directionalLight position={[4, 6, 4]} intensity={2} />
          <directionalLight position={[-4, 2, -3]} intensity={0.8} />
          <Suspense fallback={<LoadingModel />}>
            <Center>
              {modelUrl ? (
                <LoadedModel modelUrl={modelUrl} />
              ) : createModel ? (
                <AntiqueModel
                  createModel={createModel}
                  frontImageUrl={frontImageUrl}
                />
              ) : null}
            </Center>
            <Environment preset="studio" />
          </Suspense>
          <ContactShadows
            position={[0, -1, 0]}
            opacity={0.35}
            scale={10}
            blur={2}
          />
          <OrbitControls
            enableDamping
            dampingFactor={0.08}
            minDistance={1}
            maxDistance={10}
          />
        </Canvas>
      </ViewerErrorBoundary>
    </div>
  );
}