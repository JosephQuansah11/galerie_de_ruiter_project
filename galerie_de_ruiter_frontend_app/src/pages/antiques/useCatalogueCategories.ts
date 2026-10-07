import { useEffect, useState } from "react";
import { getVisibleCategories } from "@/apis/backend_api";
import type { Category } from "@/models/antiques/Antique";

export function useCatalogueCategories(initialCategory: string) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState(false);
  const [category, setCategory] = useState(initialCategory);
  useEffect(() => setCategory(initialCategory), [initialCategory]);
  useEffect(() => {
    let active = true;
    getVisibleCategories()
      .then((items) => { if (active) setCategories(items); })
      .catch(() => { if (active) setCategoriesError(true); })
      .finally(() => { if (active) setCategoriesLoading(false); });
    return () => { active = false; };
  }, []);
  return { categories, categoriesLoading, categoriesError, category, setCategory };
}
