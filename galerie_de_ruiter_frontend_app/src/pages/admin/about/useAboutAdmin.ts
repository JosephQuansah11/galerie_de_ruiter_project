import { useEffect, useState, type FormEvent } from "react";
import { getAboutContent, updateAboutContent } from "@/apis/backend_api";
import { publishContentUpdate } from "@/services/contentUpdates";

export function useAboutAdmin() {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState(false);
  useEffect(() => {
    getAboutContent().then((result) => setContent(result.content))
      .catch(() => setError(true)).finally(() => setLoading(false));
  }, []);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setSaving(true); setMessage(undefined);
    try {
      const result = await updateAboutContent(content);
      setContent(result.content); publishContentUpdate("about");
      setMessage("aboutUpdated"); setError(false);
    } catch { setError(true); } finally { setSaving(false); }
  };
  return { content, setContent, loading, saving, message, error, submit };
}
