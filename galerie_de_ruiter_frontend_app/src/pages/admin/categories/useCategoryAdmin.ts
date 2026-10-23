import { useEffect, useRef, useState, type FormEvent } from "react";
import axios from "axios";
import { createCategory, deleteCategory, getAllCategories, updateCategory } from "@/apis/backend_api";
import { describeApiError } from "@/apis/apiError";
import type { Category } from "@/models/antiques/Antique";
import { publishContentUpdate, subscribeToContentUpdates } from "@/services/contentUpdates";
import i18n from "@/i18n";

/** Updates or removes one node wherever it sits in the category tree the API sends. */
function mapTree(categories: Category[], update: (category: Category) => Category | undefined): Category[] {
  return categories.flatMap((category) => {
    const mapped = update(category);
    if (!mapped) return [];
    return [{ ...mapped, children: mapTree(category.children ?? [], update) }];
  });
}

export function useCategoryAdmin(isAdmin: boolean) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [saveError, setSaveError] = useState<string>();
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState("");
  const [createError, setCreateError] = useState<string>();
  /** The local event from this hook's own save must not immediately refetch what it just wrote. */
  const skipLocalRefresh = useRef(false);
  const announce = () => {
    skipLocalRefresh.current = true;
    publishContentUpdate("categories");
  };
  useEffect(() => {
    if (!isAdmin) return;
    getAllCategories().then(setCategories).catch(() => setError(true)).finally(() => setLoading(false));
  }, [isAdmin]);
  // A category changed in another tab or by another administrator is refetched instead of asking
  // the visitor to reload the page.
  useEffect(() => {
    if (!isAdmin) return;
    return subscribeToContentUpdates("categories", () => {
      if (skipLocalRefresh.current) {
        skipLocalRefresh.current = false;
        return;
      }
      getAllCategories().then((items) => { setCategories(items); setError(false); }).catch(() => setError(true));
    });
  }, [isAdmin]);
  const toggle = async (category: Category) => {
    setSaveError(undefined);
    try {
      const updated = await updateCategory({ ...category, visible: !category.visible });
      setCategories((current) => mapTree(current, (item) => item.id === updated.id ? { ...item, ...updated } : item));
      announce();
    } catch (thrown) {
      // A save can fail on the CSRF token or on a restarting API; show that instead of letting the
      // click turn into an uncaught rejection that only a developer would see.
      setSaveError(describeApiError(thrown, i18n.t("categoriesSaveError")));
    }
  };
  const addCategory = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    setCreateError(undefined);
    try {
      const created = await createCategory(name.trim(), parentId || undefined);
      setCategories((current) => [...current, created]); announce();
      setName(""); setParentId("");
    } catch (thrown) {
      const conflict = axios.isAxiosError(thrown) && thrown.response?.status === 409;
      setCreateError(conflict
        ? i18n.t("categoryExists")
        : describeApiError(thrown, i18n.t("categoriesSaveError")));
    }
  };
  const removeCategory = async (id: string) => {
    setSaveError(undefined);
    try {
      await deleteCategory(id);
      setCategories((current) => mapTree(current, (item) => item.id === id ? undefined : item));
      announce();
    } catch (thrown) {
      setSaveError(describeApiError(thrown, i18n.t("categoriesSaveError")));
    }
  };
  return {
    categories, loading, error, saveError, name, setName, parentId, setParentId,
    createError, toggle, addCategory, removeCategory,
  };
}
