import { useEffect, useRef, useState, type FormEvent } from "react";
import { addAntique, uploadAntiqueImage, uploadAntiqueModel } from "@/apis/backend_api";
import type { AntiqueForm } from "@/models/antiques/Antique";
import { publishContentUpdate } from "@/services/contentUpdates";
import { logRequestFailure, modelUploadErrorKey, saveErrorKey } from "./antiqueSaveErrors";
import { isUploadableModel } from "./modelUploadLimits";

type Draft = Omit<AntiqueForm, "price"> & { price: string };
const empty: Draft = { title: "", artistId: "", description: "", price: "", categoryId: "", modelUrl: "" };

/** A photograph the admin picked, paired with an object URL used for its preview. */
export type DraftImage = { id: string; file: File; url: string };

export function useNewAntiqueDraft(openAntique: (id: string) => void) {
  const [form, setForm] = useState(empty);
  const [images, setImages] = useState<DraftImage[]>([]);
  const [modelFile, setModelFile] = useState<File>();
  const [modelFileInvalid, setModelFileInvalid] = useState(false);
  const [modelUploaded, setModelUploaded] = useState(false);
  const [createdId, setCreatedId] = useState<string>();
  const [uploadedFileCount, setUploadedFileCount] = useState(0);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string>();
  const nextImageId = useRef(0);
  // Preview thumbnails are object URLs, so they are released when an image is removed or
  // when the page goes away instead of leaking for the life of the tab.
  const imagesRef = useRef<DraftImage[]>([]);
  imagesRef.current = images;
  useEffect(() => () => {
    imagesRef.current.forEach((image) => URL.revokeObjectURL(image.url));
  }, []);
  const files = images.map((image) => image.file);
  const update = (field: keyof Draft, value: string) => setForm((current) => ({ ...current, [field]: value }));
  // Every pick is appended, so the gallery can add photographs a few at a time instead of
  // replacing the whole selection each time.
  const selectImages = (input: FileList | null) => {
    const selected = Array.from(input ?? []);
    if (selected.length === 0) return;
    if (selected.some((file) => !file.type.startsWith("image/"))) return setMessage("pleaseChooseImage");
    const added = selected.map((file) => {
      nextImageId.current += 1;
      return { id: `image-${nextImageId.current}`, file, url: URL.createObjectURL(file) };
    });
    setImages((current) => [...current, ...added]);
    setMessage(undefined);
  };
  const removeImage = (id: string) => {
    const target = imagesRef.current.find((image) => image.id === id);
    if (target) URL.revokeObjectURL(target.url);
    setImages((current) => current.filter((image) => image.id !== id));
    setMessage(undefined);
  };
  const selectModelFile = (input: FileList | null) => {
    const selected = input?.[0];
    if (selected && !isUploadableModel(selected)) {
      setModelFileInvalid(true);
      setMessage("glbUploadInvalid");
      return;
    }
    setModelFileInvalid(false);
    setModelFile(selected);
    if (selected) update("modelUrl", "");
    setMessage(undefined);
  };
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setMessage(undefined);
    let antiqueId: string;
    try {
      if (createdId) {
        antiqueId = createdId;
      } else {
        const created = await addAntique({ ...form, price: Number(form.price), categoryId: form.categoryId || undefined, modelUrl: modelFile ? undefined : form.modelUrl || undefined });
        antiqueId = created.id;
        setCreatedId(created.id);
      }
    } catch (error) {
      setMessage(saveErrorKey(error));
      setSaving(false);
      return;
    }
    try {
      for (let index = uploadedFileCount; index < files.length; index += 1) {
        await uploadAntiqueImage(antiqueId, files[index]);
        setUploadedFileCount(index + 1);
      }
    } catch (error) {
      const errorKey = saveErrorKey(error);
      setMessage(errorKey === "antiqueSavePermissionError"
        ? errorKey
        : errorKey === "antiqueSaveConnectionError"
          ? "antiqueImageConnectionError"
          : "antiqueImageUploadFailed");
      setSaving(false);
      publishContentUpdate("antiques");
      return;
    }
    if (modelFile && !modelUploaded) {
      try {
        await uploadAntiqueModel(antiqueId, modelFile);
        setModelUploaded(true);
      } catch (error) {
        logRequestFailure(`3D model upload ${modelFile.name}`, error);
        // The model is stored by the gallery API itself, so a network failure is an upload
        // failure - not a separate "model service" being unreachable.
        setMessage(modelUploadErrorKey(error));
        setSaving(false);
        publishContentUpdate("antiques");
        return;
      }
    }
    publishContentUpdate("antiques");
    openAntique(antiqueId);
    setSaving(false);
  };
  return { form, update, images, removeImage, modelFileName: modelFile?.name,
    modelFileInvalid, createdId, saving, message, setMessage, selectImages, selectModelFile, submit };
}
