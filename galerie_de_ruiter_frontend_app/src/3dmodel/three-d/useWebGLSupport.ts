import { useEffect, useState } from "react";

export function useWebGLSupport() {
  const [supported, setSupported] = useState<boolean>();
  useEffect(() => {
    try {
      const canvas = document.createElement("canvas");
      setSupported(Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl")));
    } catch (error) {
      console.error("Could not detect WebGL support.", error);
      setSupported(false);
    }
  }, []);
  return supported;
}
