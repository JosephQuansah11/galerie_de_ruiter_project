import { useEffect, useState, type FormEvent } from "react";
import { Alert, Button, Form, Spinner } from "react-bootstrap";
import { Eye, EyeOff, ListTree, Plus, Trash2 } from "lucide-react";
import { createCategory, deleteCategory, getAllCategories, updateCategory } from "@/apis/backend_api";
import type { Category } from "@/models/antiques/Antique";
import { useAuth } from "@/context/AuthContext";

export default function CategoryAdminPage() {
  const auth = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState("");
  const [createError, setCreateError] = useState<string>();

  useEffect(() => {
    if (!auth.isAdmin) return;
    getAllCategories().then(setCategories).catch(() => setError(true)).finally(() => setLoading(false));
  }, [auth.isAdmin]);

  const toggle = async (category: Category) => {
    const updated = await updateCategory({ ...category, visible: !category.visible });
    setCategories((current) => current.map((item) => item.id === updated.id ? updated : item));
  };

  const addCategory = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    setCreateError(undefined);
    try {
      const created = await createCategory(name.trim(), parentId || undefined);
      setCategories((current) => [...current, created]);
      setName("");
      setParentId("");
    } catch {
      setCreateError("This category already exists here.");
    }
  };

  const removeCategory = async (id: string) => {
    await deleteCategory(id);
    setCategories((current) => current.filter((category) => category.id !== id));
  };

  if (!auth.isAdmin) return <Alert variant="warning">Administrator access is required.</Alert>;
  return <section className="admin-page"><div className="shopping-heading"><div><span className="catalogue-artist">ADMINISTRATION</span><h1>Catalogue navigation</h1></div><ListTree size={32} /></div><p className="admin-intro">Create categories and choose which ones visitors can see. Ordering follows assigned antique counts.</p><Form className="category-create-form" onSubmit={addCategory}><Form.Control required value={name} onChange={(event) => setName(event.target.value)} placeholder="New category name" /><Form.Select value={parentId} onChange={(event) => setParentId(event.target.value)}><option value="">Top-level category</option>{categories.map((category) => <option key={category.id} value={category.id}>Subcategory of {category.name}</option>)}</Form.Select><Button type="submit"><Plus size={16} /> Add category</Button></Form>{createError && <Alert variant="warning">{createError}</Alert>}{loading && <div className="catalogue-state"><Spinner animation="border" size="sm" /> Loading categories...</div>}{error && <Alert variant="danger">Categories could not be loaded.</Alert>}<div className="admin-list">{categories.map((category) => <div className="admin-row" key={category.id}><div><strong>{category.name}</strong><span>{category.itemCount} pieces</span></div><div className="admin-row-actions"><Form.Check type="switch" id={`category-${category.id}`} checked={category.visible} onChange={() => toggle(category)} label={category.visible ? <><Eye size={15} /> Visible</> : <><EyeOff size={15} /> Hidden</>} /><Button variant="link" aria-label={`Delete ${category.name}`} onClick={() => removeCategory(category.id)}><Trash2 size={16} /></Button></div></div>)}</div></section>;
}