import { useEffect, useRef, useState } from "react";

/** A picked image file, paired with an object URL used for its preview. */
export type SelectedImage = { id: string; file: File; url: string };

/**
 * Tracks the image files an admin has picked but not yet uploaded.
 *
 * Picks append to the selection instead of replacing it, so photographs can be added a few
 * at a time, and each image gets an object URL for a live preview that is released when the
 * image is removed or when the component goes away. The add form and the edit dialog share
 * this hook so both behave the same way.
 */
export function useImageSelection(onRejectImage?: () => void) {
  const [images, setImages] = useState<SelectedImage[]>([]);
  const nextId = useRef(0);
  // The cleanup effect needs the latest list without re-subscribing on every change.
  const imagesRef = useRef<SelectedImage[]>([]);
  imagesRef.current = images;
  useEffect(() => () => {
    imagesRef.current.forEach((image) => URL.revokeObjectURL(image.url));
  }, []);

  /** Adds the picked files. Returns false when nothing was picked or a file is not an image. */
  const add = (input: FileList | null): boolean => {
    const selected = Array.from(input ?? []);
    if (selected.length === 0) return false;
    if (selected.some((file) => !file.type.startsWith("image/"))) {
      onRejectImage?.();
      return false;
    }
    const added = selected.map((file) => {
      nextId.current += 1;
      return { id: `image-${nextId.current}`, file, url: URL.createObjectURL(file) };
    });
    setImages((current) => [...current, ...added]);
    return true;
  };

  const remove = (id: string) => {
    const target = imagesRef.current.find((image) => image.id === id);
    if (target) URL.revokeObjectURL(target.url);
    setImages((current) => current.filter((image) => image.id !== id));
  };

  /** Drops every pending image, releasing their preview URLs. */
  const clear = () => {
    imagesRef.current.forEach((image) => URL.revokeObjectURL(image.url));
    setImages([]);
  };

  return { images, add, remove, clear };
}
