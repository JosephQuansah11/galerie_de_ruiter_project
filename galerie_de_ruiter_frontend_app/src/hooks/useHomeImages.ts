import { useEffect, useState } from "react";
import { getHomeImages, type HomeImage } from "@/apis/home_api";
import { subscribeToContentUpdates } from "@/services/contentUpdates";

/** Photographs for the welcome slider, refreshed whenever the gallery changes them. */
export function useHomeImages() {
  const [images, setImages] = useState<HomeImage[]>([]);
  useEffect(() => {
    let active = true;
    const load = () => getHomeImages()
      .then((value) => { if (active) setImages(value); })
      .catch(() => { if (active) setImages([]); });
    void load();
    const unsubscribe = subscribeToContentUpdates("home", load);
    return () => { active = false; unsubscribe(); };
  }, []);
  return images;
}
