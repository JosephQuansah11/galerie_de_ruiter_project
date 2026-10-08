import { useEffect, useRef, useState } from "react";
import type { ModelViewerElement } from "@google/model-viewer";

type Props = { modelUrl: string; posterUrl?: string; alt: string; loadErrorText: string };

export function GlbModelViewer({ modelUrl, posterUrl, alt, loadErrorText }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    setLoadFailed(false);
    let active = true;
    let viewer: ModelViewerElement | undefined;
    const handleError = () => setLoadFailed(true);
    void import("@google/model-viewer").then(() => {
      if (!active) return;
      viewer = document.createElement("model-viewer") as ModelViewerElement;
      viewer.src = modelUrl;
      viewer.alt = alt;
      viewer.setAttribute("camera-controls", "");
      viewer.setAttribute("auto-rotate", "");
      viewer.setAttribute("ar", "");
      viewer.setAttribute("ar-modes", "webxr scene-viewer quick-look");
      viewer.setAttribute("environment-image", "neutral");
      viewer.setAttribute("exposure", "0.8");
      viewer.setAttribute("shadow-intensity", "0.4");
      if (posterUrl) viewer.poster = posterUrl;
      viewer.addEventListener("error", handleError);
      host.replaceChildren(viewer);
    }).catch((error: unknown) => {
      if (!active) return;
      console.error("Could not initialize the 3D model viewer.", error);
      setLoadFailed(true);
    });

    return () => {
      active = false;
      viewer?.removeEventListener("error", handleError);
      viewer?.remove();
    };
  }, [alt, modelUrl, posterUrl]);

  return <div className="glb-model-viewer">
    <div className="glb-model-viewer-host" ref={hostRef} />
    {loadFailed && <p className="glb-model-viewer-error" role="alert">{loadErrorText}</p>}
  </div>;
}
