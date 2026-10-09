import { useEffect, useState } from "react";
import { deleteHomeImage, getHomeImages, uploadHomeImage, type HomeImage } from "@/apis/home_api";
import { describeApiError } from "@/apis/apiError";
import { publishContentUpdate } from "@/services/contentUpdates";
import i18n from "@/i18n";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const SUPPORTED_TYPES = ["image/png", "image/jpeg", "image/webp"];

/** Manage the photographs shown in the welcome page slider. */
export function useHomeImagesAdmin() {
  const [images, setImages] = useState<HomeImage[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    let active = true;
    getHomeImages()
      .then((value) => { if (active) setImages(value); })
      .catch(() => { if (active) setError(i18n.t("imageUploadFailed")); });
    return () => { active = false; };
  }, []);

  const add = async (image: File, caption: string) => {
    if (!SUPPORTED_TYPES.includes(image.type)) {
      setError(i18n.t("imageUnsupported"));
      return;
    }
    if (image.size > MAX_IMAGE_BYTES) {
      setError(i18n.t("imageTooLarge"));
      return;
    }
    setBusy(true);
    setError(undefined);
    try {
      const created = await uploadHomeImage(image, caption);
      setImages((current) => [...current, created]);
      publishContentUpdate("home");
    } catch (thrown) {
      setError(describeApiError(thrown, i18n.t("imageUploadFailed")));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    setBusy(true);
    setError(undefined);
    try {
      await deleteHomeImage(id);
      setImages((current) => current.filter((image) => image.id !== id));
      publishContentUpdate("home");
    } catch (thrown) {
      setError(describeApiError(thrown, i18n.t("imageUploadFailed")));
    } finally {
      setBusy(false);
    }
  };

  return { images, busy, error, add, remove };
}
