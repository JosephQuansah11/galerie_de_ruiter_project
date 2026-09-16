import { useEffect, useState } from "react";
import { Alert, Button, Card, Container, Form, Spinner } from "react-bootstrap";
import { LibraryBig, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { addAntique, getAllCategories, uploadAntiqueImage } from "@/apis/backend_api";
import type { Category } from "@/models/antiques/Antique";

export default function AddNewAntique() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string>();
  const [form, setForm] = useState({ title: "", artistId: "", description: "", price: "", categoryId: "", imageUrl: "", modelUrl: "" });
  const [imageFileName, setImageFileName] = useState("");
  const [imageFile, setImageFile] = useState<File>();

  useEffect(() => { getAllCategories().then(setCategories).catch(() => setMessage("Categories could not be loaded.")); }, []);
  const update = (field: keyof typeof form, value: string) => setForm((current) => ({ ...current, [field]: value }));
  const readImage = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) { setMessage("Please choose an image file."); return; }
    const reader = new FileReader();
    setImageFile(file);
    setImageFileName(file.name);
  };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage(undefined);
    try {
      const created = await addAntique({ ...form, imageUrl: undefined, price: Number(form.price), categoryId: form.categoryId || undefined, modelUrl: form.modelUrl || undefined });
      if (imageFile) await uploadAntiqueImage(created.id, imageFile);
      navigate(`/antiques/${created.id}`);
    } catch { setMessage("The antique could not be saved."); } finally { setSaving(false); }
  };

  return <Container className="admin-form-page"><Card><Card.Header><LibraryBig size={20} /> Add antique</Card.Header><Card.Body><p className="admin-intro">Assign a category, local image or web image, and an optional 3D model URL.</p>{message && <Alert variant="danger">{message}</Alert>}<Form onSubmit={submit}><Form.Group className="mb-3"><Form.Label>Title</Form.Label><Form.Control required value={form.title} onChange={(event) => update("title", event.target.value)} /></Form.Group><Form.Group className="mb-3"><Form.Label>Artist ID</Form.Label><Form.Control required value={form.artistId} onChange={(event) => update("artistId", event.target.value)} placeholder="Designer UUID" /></Form.Group><Form.Group className="mb-3"><Form.Label>Category</Form.Label><Form.Select required value={form.categoryId} onChange={(event) => update("categoryId", event.target.value)}><option value="">Choose a category</option>{categories.flatMap((category) => [<option key={category.id} value={category.id}>{category.name}</option>, ...category.children.map((child) => <option key={child.id} value={child.id}>Subcategory: {child.name}</option>)])}</Form.Select></Form.Group><Form.Group className="mb-3"><Form.Label>Upload local image</Form.Label><Form.Control type="file" accept="image/*" onChange={(event) => { const input = event.currentTarget as HTMLInputElement; readImage(input.files?.[0]); }} /><Form.Text>{imageFileName || "Choose an image from your computer."}</Form.Text></Form.Group><Form.Group className="mb-3"><Form.Label>Or use image URL</Form.Label><Form.Control type="url" value={form.imageUrl.startsWith("data:") ? "" : form.imageUrl} onChange={(event) => { setImageFileName(""); update("imageUrl", event.target.value); }} placeholder="https://... or /images/item.jpg" /></Form.Group><Form.Group className="mb-3"><Form.Label>3D model URL</Form.Label><Form.Control type="url" value={form.modelUrl} onChange={(event) => update("modelUrl", event.target.value)} placeholder="https://.../model.glb or viewer URL" /></Form.Group><Form.Group className="mb-3"><Form.Label>Price</Form.Label><Form.Control required min="0" step="0.01" type="number" value={form.price} onChange={(event) => update("price", event.target.value)} /></Form.Group><Form.Group className="mb-3"><Form.Label>Description</Form.Label><Form.Control as="textarea" rows={4} value={form.description} onChange={(event) => update("description", event.target.value)} /></Form.Group><Button disabled={saving} type="submit"><Save size={16} /> {saving ? <><Spinner size="sm" /> Saving...</> : "Save antique"}</Button></Form></Card.Body></Card></Container>;
}
