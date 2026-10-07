import { useState, type FormEvent } from "react";
import axios from "axios";
import { addAntique, uploadAntiqueImage } from "@/apis/backend_api";
import type { AntiqueForm } from "@/models/antiques/Antique";
import { publishContentUpdate } from "@/services/contentUpdates";

type Draft = Omit<AntiqueForm, "price"> & { price: string };
const empty: Draft = { title: "", artistId: "", description: "", price: "", categoryId: "", modelUrl: "" };

function saveErrorKey(error: unknown): string {
  if (!axios.isAxiosError(error)) return "antiqueCouldNotSave";
  const status = error.response?.status;
  if (status === 401 || status === 403) return "antiqueSavePermissionError";
  if (status === 400 || status === 422) return "antiqueSaveValidationError";
  if (!error.response) return "antiqueSaveConnectionError";
  return "antiqueCouldNotSave";
}

export function useNewAntiqueDraft(openAntique: (id: string) => void) {
  const [form, setForm] = useState(empty);
  const [files, setFiles] = useState<File[]>([]);
  const [createdId, setCreatedId] = useState<string>();
  const [uploadedFileCount, setUploadedFileCount] = useState(0);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string>();
  const update = (field: keyof Draft, value: string) => setForm((current) => ({ ...current, [field]: value }));
  const selectImages = (input: FileList | null) => {
    const selected = Array.from(input ?? []);
    if (selected.some((file) => !file.type.startsWith("image/"))) return setMessage("pleaseChooseImage");
    setFiles(selected); setMessage(undefined);
  };
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setSaving(true); setMessage(undefined);
    let antiqueId: string;
    try {
      if (createdId) {
        antiqueId = createdId;
      } else {
        const created = await addAntique({ ...form, price: Number(form.price), categoryId: form.categoryId || undefined, modelUrl: form.modelUrl || undefined });
        antiqueId = created.id;
        setCreatedId(created.id);
      }
    } catch (error) {
      console.error("Antique creation failed", error);
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
      console.error("Antique image upload failed after creation", error);
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
    publishContentUpdate("antiques");
    openAntique(antiqueId);
    setSaving(false);
  };
  return { form, update, files, fileNames: files.map((file) => file.name), createdId, saving, message, setMessage, selectImages, submit };
}
