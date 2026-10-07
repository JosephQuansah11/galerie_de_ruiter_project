import { useEffect, useState } from "react";
import type Antique from "@/models/antiques/Antique";
import type { AntiqueForm } from "@/models/antiques/Antique";
import { getAllAntiques, addAntique } from "@/apis/backend_api";
import { publishContentUpdate, subscribeToContentUpdates } from "@/services/contentUpdates";

export function useAntiqueContent() {
  const [antiques, setAntiques] = useState<Antique[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const items = await getAllAntiques();
        if (active) { setAntiques(items); setError(null); }
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : String(cause));
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    const unsubscribe = subscribeToContentUpdates("antiques", load);
    return () => { active = false; unsubscribe(); };
  }, []);
  return { antiques, loading, error };
}

export async function AddAntiqueItem(antique: AntiqueForm): Promise<void> {
  await addAntique(antique);
  publishContentUpdate("antiques");
}
