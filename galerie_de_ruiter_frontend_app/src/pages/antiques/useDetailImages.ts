import { useCallback, useEffect, useState } from "react";
import type { Position } from "./detailTypes";

export function useDetailImages() {
  const [images, setImages] = useState<Partial<Record<Position, File>>>({});
  const [previews, setPreviews] = useState<Partial<Record<Position, string>>>({});
  useEffect(() => () => Object.values(previews).forEach((url) => url && URL.revokeObjectURL(url)), [previews]);
  const selectImage = useCallback((position: Position, file?: File) => {
    if (!file) return;
    setImages((current) => ({ ...current, [position]: file }));
    setPreviews((current) => {
      if (current[position]) URL.revokeObjectURL(current[position]!);
      return { ...current, [position]: URL.createObjectURL(file) };
    });
  }, []);
  return { images, previews, selectImage };
}
