import { useEffect, useState, type FormEvent } from "react";
import axios from "axios";
import { createCategory, deleteCategory, getAllCategories, updateCategory } from "@/apis/backend_api";
import { describeApiError } from "@/apis/apiError";
import type { Category } from "@/models/antiques/Antique";
import { publishContentUpdate } from "@/services/contentUpdates";
import i18n from "@/i18n";

export function useCategoryAdmin(isAdmin: boolean) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [saveError, setSaveError] = useState<string>();
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState("");
  const [createError, setCreateError] = useState<string>();
  useEffect(() => {
    if (!isAdmin) return;
    getAllCategories().then(setCategories).catch(() => setError(true)).finally(() => setLoading(false));
  }, [isAdmin]);
  const toggle = async (category: Category) => {
    setSaveError(undefined);
    try {
      const updated = await updateCategory({ ...category, visible: !category.visible });
      setCategories((current) => current.map((item) => item.id === updated.id ? updated : item));
      publishContentUpdate("categories");
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
      setCategories((current) => [...current, created]); publishContentUpdate("categories");
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
      setCategories((current) => current.filter((item) => item.id !== id));
      publishContentUpdate("categories");
    } catch (thrown) {
      setSaveError(describeApiError(thrown, i18n.t("categoriesSaveError")));
    }
  };
  return {
    categories, loading, error, saveError, name, setName, parentId, setParentId,
    createError, toggle, addCategory, removeCategory,
  };
}
