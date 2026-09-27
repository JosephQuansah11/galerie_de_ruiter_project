import { useEffect, useState, type FormEvent } from "react";
import { Alert, Button, Card, Container, Form, Spinner } from "react-bootstrap";
import { LibraryBig, Plus, Save, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  addAntique,
  createDesigner,
  getVisibleCategories,
  searchDesigners,
  uploadAntiqueImage,
} from "@/apis/backend_api";
import type { Category, Designer } from "@/models/antiques/Antique";

export default function AddNewAntique() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [designers, setDesigners] = useState<Designer[]>([]);
  const [artistQuery, setArtistQuery] = useState("");
  const [newArtist, setNewArtist] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
  });
  const [creatingArtist, setCreatingArtist] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string>();
  const [form, setForm] = useState({
    title: "",
    artistId: "",
    description: "",
    price: "",
    categoryId: "",
    modelUrl: "",
  });
  const [imageFileNames, setImageFileNames] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);

  useEffect(() => {
    getVisibleCategories()
      .then((loadedCategories) => {
        setCategories(loadedCategories);
      })
      .catch(() => setMessage("Categories could not be loaded."));
  }, []);

  useEffect(() => {
    const query = artistQuery.trim();
    if (!query) {
      setDesigners([]);
      return;
    }
    const timeout = window.setTimeout(() => {
      searchDesigners(query)
        .then(setDesigners)
        .catch(() => setMessage("Artists could not be loaded."));
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [artistQuery]);

  const update = (field: keyof typeof form, value: string) =>
    setForm((current) => ({ ...current, [field]: value }));

  const saveContent = saving ? <Spinner size="sm" /> : <Save size={16} />;

  const selectImages = (files: FileList | null) => {
    const selectedFiles = Array.from(files ?? []);
    if (selectedFiles.some((file) => !file.type.startsWith("image/"))) {
      setMessage("Please choose an image file.");
      return;
    }
    setImageFiles(selectedFiles);
    setImageFileNames(selectedFiles.map((file) => file.name));
  };

  const selectArtist = (designer: Designer) => {
    const name = [designer.firstName, designer.middleName, designer.lastName]
      .filter(Boolean)
      .join(" ");
    update("artistId", designer.id);
    setArtistQuery(name);
    setDesigners([]);
  };

  const addArtist = async () => {
    if (!newArtist.firstName.trim() || !newArtist.lastName.trim()) return;
    setCreatingArtist(true);
    setMessage(undefined);
    try {
      const created = await createDesigner({
        firstName: newArtist.firstName.trim(),
        middleName: newArtist.middleName.trim() || null,
        lastName: newArtist.lastName.trim(),
      });
      selectArtist(created);
      setNewArtist({ firstName: "", middleName: "", lastName: "" });
    } catch {
      setMessage("The artist could not be added.");
    } finally {
      setCreatingArtist(false);
    }
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setMessage(undefined);
    try {
      const created = await addAntique({
        ...form,
        price: Number(form.price),
        categoryId: form.categoryId || undefined,
        modelUrl: form.modelUrl || undefined,
      });

      await Promise.all(
        imageFiles.map((imageFile) =>
          uploadAntiqueImage(created.id, imageFile),
        ),
      );

      navigate(`/antiques/${created.id}`);
    } catch {
      setMessage("The antique could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Container className="admin-form-page add-antique-page">
      <Card>
        <Card.Header>
          <LibraryBig size={20} /> Catalogue entry
        </Card.Header>
        <Card.Body>
          <div className="add-antique-intro">
            <span>NEW OBJECT</span>
            <h1>Add an antique</h1>
            <p>
              Give the collection a clear story, a maker, and a lasting image.
            </p>
          </div>
          {message && <Alert variant="danger">{message}</Alert>}
          <Form onSubmit={submit}>
            <Form.Group className="mb-3">
              <Form.Label>Title</Form.Label>
              <Form.Control
                required
                value={form.title}
                onChange={(event) => update("title", event.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Artist</Form.Label>
              <div className="position-relative">
                <Form.Control
                  required
                  value={artistQuery}
                  onChange={(event) => {
                    setArtistQuery(event.target.value);
                    update("artistId", "");
                  }}
                  placeholder="Search by artist name"
                  autoComplete="off"
                />
                <Search
                  className="position-absolute top-50 end-0 translate-middle-y me-3 text-muted"
                  size={18}
                />
              </div>
              {designers.length > 0 && (
                <div className="list-group mt-1">
                  {designers.map((designer) => (
                    <button
                      className="list-group-item list-group-item-action"
                      type="button"
                      key={designer.id}
                      onClick={() => selectArtist(designer)}
                    >
                      {[
                        designer.firstName,
                        designer.middleName,
                        designer.lastName,
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    </button>
                  ))}
                </div>
              )}
            </Form.Group>
            <fieldset className="border rounded p-3 mb-3">
              <legend className="float-none w-auto px-2 fs-6">
                Add artist
              </legend>
              <div className="row g-2">
                <div className="col-md">
                  <Form.Control
                    value={newArtist.firstName}
                    onChange={(event) =>
                      setNewArtist((artist) => ({
                        ...artist,
                        firstName: event.target.value,
                      }))
                    }
                    placeholder="First name"
                  />
                </div>
                <div className="col-md">
                  <Form.Control
                    value={newArtist.middleName}
                    onChange={(event) =>
                      setNewArtist((artist) => ({
                        ...artist,
                        middleName: event.target.value,
                      }))
                    }
                    placeholder="Middle name"
                  />
                </div>
                <div className="col-md">
                  <Form.Control
                    value={newArtist.lastName}
                    onChange={(event) =>
                      setNewArtist((artist) => ({
                        ...artist,
                        lastName: event.target.value,
                      }))
                    }
                    placeholder="Last name"
                  />
                </div>
                <div className="col-md-auto">
                  <Button
                    type="button"
                    variant="outline-secondary"
                    onClick={addArtist}
                    disabled={
                      creatingArtist ||
                      !newArtist.firstName.trim() ||
                      !newArtist.lastName.trim()
                    }
                  >
                    {creatingArtist ? (
                      <Spinner size="sm" />
                    ) : (
                      <Plus size={16} />
                    )}{" "}
                    Add artist
                  </Button>
                </div>
              </div>
            </fieldset>
            <Form.Group className="mb-3">
              <Form.Label>Category</Form.Label>
              <Form.Select
                required
                value={form.categoryId}
                onChange={(event) => update("categoryId", event.target.value)}
              >
                <option value="">Choose a category</option>
                {categories.flatMap((category) => [
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>,
                  ...category.children.map((child) => (
                    <option key={child.id} value={child.id}>
                      {category.name} / {child.name}
                    </option>
                  )),
                ])}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Upload local images</Form.Label>
              <Form.Control
                type="file"
                accept="image/*"
                multiple
                onChange={(event) =>
                  selectImages((event.currentTarget as HTMLInputElement).files)
                }
              />
              <Form.Text>
                {imageFileNames.length
                  ? imageFileNames.join(", ")
                  : "Choose images from your computer."}
              </Form.Text>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>3D model URL</Form.Label>
              <Form.Control
                type="url"
                value={form.modelUrl}
                onChange={(event) => update("modelUrl", event.target.value)}
                placeholder="https://.../model.glb or viewer URL"
              />
            </Form.Group>
            <Form.Group className="mb-4">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={form.description}
                onChange={(event) => update("description", event.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-4">
              <Form.Label>Price (EUR)</Form.Label>
              <Form.Control
                required
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(event) => update("price", event.target.value)}
              />
            </Form.Group>
            <Button type="submit" variant="primary" disabled={saving}>
              {saveContent}
              Save antique
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
}
