import { useEffect, useState } from "react";
import { getHomeContent, type HomeContent } from "@/apis/home_api";
import { subscribeToContentUpdates } from "@/services/contentUpdates";

/**
 * Reads the gallery's own home page copy. Undefined fields mean "use the translated
 * default", so the page keeps working before the admin writes anything.
 */
export function useHomeContent() {
  const [content, setContent] = useState<HomeContent>();
  useEffect(() => {
    let active = true;
    const load = () => getHomeContent()
      .then((value) => { if (active) setContent(value); })
      .catch(() => { if (active) setContent(undefined); });
    void load();
    const unsubscribe = subscribeToContentUpdates("home", load);
    return () => { active = false; unsubscribe(); };
  }, []);
  return content;
}
