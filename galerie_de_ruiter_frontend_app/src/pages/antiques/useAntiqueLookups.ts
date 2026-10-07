import { useEffect, useState } from "react";
import { createDesigner, getVisibleCategories, searchDesigners } from "@/apis/backend_api";
import type { Category, Designer } from "@/models/antiques/Antique";

export function useAntiqueLookups(select: (designer: Designer) => void) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [designers, setDesigners] = useState<Designer[]>([]);
  const [query, setQuery] = useState("");
  const [newArtist, setNewArtist] = useState({ firstName: "", middleName: "", lastName: "" });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string>();
  useEffect(() => { getVisibleCategories().then(setCategories).catch(() => setError("categoriesCouldNotLoad")); }, []);
  useEffect(() => {
    const search = query.trim();
    if (!search) { setDesigners([]); return; }
    const timer = window.setTimeout(() => searchDesigners(search).then(setDesigners).catch(() => setError("artistsCouldNotLoad")), 250);
    return () => window.clearTimeout(timer);
  }, [query]);
  const chooseArtist = (designer: Designer) => {
    select(designer); setQuery([designer.firstName, designer.middleName, designer.lastName].filter(Boolean).join(" "));
    setDesigners([]);
  };
  const addArtist = async () => {
    if (!newArtist.firstName.trim() || !newArtist.lastName.trim()) return;
    setCreating(true);
    try {
      const created = await createDesigner({ firstName: newArtist.firstName.trim(), middleName: newArtist.middleName.trim() || null, lastName: newArtist.lastName.trim() });
      chooseArtist(created); setNewArtist({ firstName: "", middleName: "", lastName: "" });
    } catch { setError("artistCouldNotAdd"); } finally { setCreating(false); }
  };
  return { categories, designers, query, setQuery, newArtist, setNewArtist, creating, error, chooseArtist, addArtist };
}
