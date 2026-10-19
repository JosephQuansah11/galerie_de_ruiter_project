import { useEffect, useState } from "react";
import { createDesigner, searchDesigners } from "@/apis/backend_api";
import type { Designer } from "@/models/antiques/Antique";

/**
 * The artist search and the inline "add artist" form, without the category lookup. The single
 * antique form needs both; the folder import only needs an artist, so it can use this on its own.
 */
export function useDesignerDirectory(select: (designer: Designer) => void) {
  const [designers, setDesigners] = useState<Designer[]>([]);
  const [query, setQuery] = useState("");
  const [newArtist, setNewArtist] = useState({ firstName: "", middleName: "", lastName: "" });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    const search = query.trim();
    if (!search) {
      setDesigners([]);
      return;
    }
    const timer = window.setTimeout(() => {
      searchDesigners(search).then(setDesigners).catch(() => setError("artistsCouldNotLoad"));
    }, 250);
    return () => window.clearTimeout(timer);
  }, [query]);

  const chooseArtist = (designer: Designer) => {
    select(designer);
    setQuery([designer.firstName, designer.middleName, designer.lastName].filter(Boolean).join(" "));
    setDesigners([]);
    setError(undefined);
  };

  const addArtist = async () => {
    if (!newArtist.firstName.trim() || !newArtist.lastName.trim()) return;
    setCreating(true);
    try {
      const created = await createDesigner({
        firstName: newArtist.firstName.trim(),
        middleName: newArtist.middleName.trim() || null,
        lastName: newArtist.lastName.trim(),
      });
      chooseArtist(created);
      setNewArtist({ firstName: "", middleName: "", lastName: "" });
    } catch {
      setError("artistCouldNotAdd");
    } finally {
      setCreating(false);
    }
  };

  return { designers, query, setQuery, newArtist, setNewArtist, creating, error, chooseArtist, addArtist };
}
