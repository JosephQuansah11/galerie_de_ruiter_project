import { useEffect, useState } from "react";
import { getVisibleCategories } from "@/apis/backend_api";
import type { Category, Designer } from "@/models/antiques/Antique";
import { useDesignerDirectory } from "./useDesignerDirectory";

/** The lookups the single-antique form needs: an artist and a category. */
export function useAntiqueLookups(select: (designer: Designer) => void) {
  const directory = useDesignerDirectory(select);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesError, setCategoriesError] = useState<string>();

  useEffect(() => {
    getVisibleCategories().then(setCategories).catch(() => setCategoriesError("categoriesCouldNotLoad"));
  }, []);

  return { ...directory, categories, error: directory.error ?? categoriesError };
}

