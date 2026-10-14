import { useEffect, useRef, useState } from "react";
import { antiqueImageIdFromUrl, resolveAntiqueImageUrl } from "@/models/antiques/Antique";

/** A photograph of the piece being edited: one already stored, or a file picked just now. */
export type EditableImage = { key: string; url: string; imageId?: string; file?: File };

/**
 * The photographs of the piece in the edit dialog. Stored images and freshly picked files live
 * in one ordered list, so the gallery can move any of them and the saved order is exactly what
 * the dialog shows. Preview URLs for new files are released when they are dropped or replaced.
 */
export function useAntiqueImageEditing() {
  const [images, setImages] = useState<EditableImage[]>([]);
  const [removedImageIds, setRemovedImageIds] = useState<string[]>([]);
  const imagesRef = useRef<EditableImage[]>([]);
  const nextKey = useRef(0);
  imagesRef.current = images;
  useEffect(() => () => releaseNew(imagesRef.current), []);

  const releaseNew = (list: EditableImage[]) => {
    list.forEach((image) => { if (image.file) URL.revokeObjectURL(image.url); });
  };

  /** Loads the stored photographs when the dialog opens, discarding anything from a previous edit. */
  const load = (imageUrls: string[]) => {
    releaseNew(imagesRef.current);
    setImages(imageUrls.map((url, index) => {
      const imageId = antiqueImageIdFromUrl(url);
      return { key: `stored-${imageId ?? index}`, url: resolveAntiqueImageUrl(url) ?? url, imageId };
    }));
    setRemovedImageIds([]);
  };

  /** Appends the picked files. Returns false when nothing was picked or a file is not an image. */
  const addFiles = (input: FileList | null): boolean => {
    const selected = Array.from(input ?? []);
    if (selected.length === 0) return false;
    if (selected.some((file) => !file.type.startsWith("image/"))) return false;
    const added = selected.map((file) => {
      nextKey.current += 1;
      return { key: `new-${nextKey.current}`, url: URL.createObjectURL(file), file };
    });
    setImages((current) => [...current, ...added]);
    return true;
  };

  const remove = (key: string) => {
    const target = imagesRef.current.find((image) => image.key === key);
    if (!target) return;
    if (target.file) URL.revokeObjectURL(target.url);
    if (target.imageId) setRemovedImageIds((current) => [...current, target.imageId as string]);
    setImages((current) => current.filter((image) => image.key !== key));
  };

  /** Moves a photograph one place earlier (`-1`) or later (`1`). */
  const move = (key: string, direction: -1 | 1) => {
    setImages((current) => {
      const index = current.findIndex((image) => image.key === key);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  return { images, removedImageIds, load, addFiles, remove, move };
}
