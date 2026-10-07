import { useState, type FormEvent } from "react";
import { addAntique, uploadAntiqueImage } from "@/apis/backend_api";
import type { AntiqueForm } from "@/models/antiques/Antique";
import { publishContentUpdate } from "@/services/contentUpdates";

type Draft = Omit<AntiqueForm, "price"> & { price: string };
const empty: Draft = { title: "", artistId: "", description: "", price: "", categoryId: "", modelUrl: "" };
export function useNewAntiqueDraft(openAntique: (id: string) => void) {
  const [form, setForm] = useState(empty);
  const [files, setFiles] = useState<File[]>([]);
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
    try {
      const created = await addAntique({ ...form, price: Number(form.price), categoryId: form.categoryId || undefined, modelUrl: form.modelUrl || undefined });
      await Promise.all(files.map((file) => uploadAntiqueImage(created.id, file)));
      publishContentUpdate("antiques"); openAntique(created.id);
    } catch { setMessage("antiqueCouldNotSave"); } finally { setSaving(false); }
  };
  return { form, update, files, fileNames: files.map((file) => file.name), saving, message, setMessage, selectImages, submit };
}
