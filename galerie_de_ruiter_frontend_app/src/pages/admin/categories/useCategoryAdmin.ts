import { useEffect, useState, type FormEvent } from "react";
import { createCategory, deleteCategory, getAllCategories, updateCategory } from "@/apis/backend_api";
import type { Category } from "@/models/antiques/Antique";
import { publishContentUpdate } from "@/services/contentUpdates";

export function useCategoryAdmin(isAdmin: boolean) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState("");
  const [createError, setCreateError] = useState<string>();
  useEffect(() => {
    if (!isAdmin) return;
    getAllCategories().then(setCategories).catch(() => setError(true)).finally(() => setLoading(false));
  }, [isAdmin]);
  const toggle = async (category: Category) => {
    const updated = await updateCategory({ ...category, visible: !category.visible });
    setCategories((current) => current.map((item) => item.id === updated.id ? updated : item));
    publishContentUpdate("categories");
  };
  const addCategory = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    setCreateError(undefined);
    try {
      const created = await createCategory(name.trim(), parentId || undefined);
      setCategories((current) => [...current, created]); publishContentUpdate("categories");
      setName(""); setParentId("");
    } catch { setCreateError("categoryExists"); }
  };
  const removeCategory = async (id: string) => {
    await deleteCategory(id); setCategories((current) => current.filter((item) => item.id !== id));
    publishContentUpdate("categories");
  };
  return { categories, loading, error, name, setName, parentId, setParentId, createError, toggle, addCategory, removeCategory };
}
