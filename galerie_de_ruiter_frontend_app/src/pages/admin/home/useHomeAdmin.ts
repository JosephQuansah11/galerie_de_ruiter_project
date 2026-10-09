import { useEffect, useState, type FormEvent } from "react";
import { getHomeContent, updateHomeContent, type HomeContent } from "@/apis/home_api";
import { publishContentUpdate } from "@/services/contentUpdates";

const emptyContent: HomeContent = { heroTitle: "", heroIntro: "", philosophyText: "", visitText: "", storyParagraphs: "" };

export function useHomeAdmin() {
  const [content, setContent] = useState<HomeContent>(emptyContent);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    getHomeContent()
      .then((value) => { if (active) setContent({ ...emptyContent, ...value }); })
      .catch(() => { if (active) setError(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const update = (field: keyof HomeContent, value: string) =>
    setContent((current) => ({ ...current, [field]: value }));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setMessage(undefined);
    setError(false);
    try {
      setContent({ ...emptyContent, ...(await updateHomeContent(content)) });
      publishContentUpdate("home");
      setMessage("homeUpdated");
    } catch {
      setError(true);
      setMessage("formCouldNotSave");
    } finally {
      setSaving(false);
    }
  };

  return { content, update, loading, saving, message, error, submit };
}
