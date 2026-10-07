import { useEffect, useState, type FormEvent } from "react";
import { Alert, Card, Container, Form, Spinner } from "react-bootstrap";
import { Button } from "@/components/ReactButton";
import { Box, LibraryBig, Plus, Save, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  addAntique,
  createDesigner,
  getVisibleCategories,
  searchDesigners,
  uploadAntiqueImage,
} from "@/apis/backend_api";
import type { Category, Designer } from "@/models/antiques/Antique";
import { useTranslation } from "react-i18next";
import { publishContentUpdate } from "@/services/contentUpdates";

export default function AddNewAntique() {
  const { t } = useTranslation();
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
      .catch(() => setMessage("categoriesCouldNotLoad"));
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
        .catch(() => setMessage("artistsCouldNotLoad"));
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [artistQuery]);

  const update = (field: keyof typeof form, value: string) =>
    setForm((current) => ({ ...current, [field]: value }));

  const saveContent = saving ? <Spinner size="sm" /> : <Save size={16} />;

  const selectImages = (files: FileList | null) => {
    const selectedFiles = Array.from(files ?? []);
    if (selectedFiles.some((file) => !file.type.startsWith("image/"))) {
      setMessage("pleaseChooseImage");
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
      setMessage("artistCouldNotAdd");
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

      publishContentUpdate("antiques");
      navigate(`/antiques/${created.id}`);
    } catch {
      setMessage("antiqueCouldNotSave");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-form-page add-antique-page">
      <Card>
        <Card.Header>
          <LibraryBig size={20} /> {t("catalogueEntry")}
        </Card.Header>
        <Card.Body>
          <div className="add-antique-intro">
            <span>{t("newObject")}</span>
            <h1>{t("addAnAntique")}</h1>
            <p>{t("addAntiqueIntro")}</p>
          </div>
          {message && <Alert variant="danger">{t(message)}</Alert>}
          <Form onSubmit={submit}>
            <Form.Group className="mb-3">
              <Form.Label>{t("title")}</Form.Label>
              <Form.Control
                required
                value={form.title}
                onChange={(event) => update("title", event.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>{t("artist")}</Form.Label>
              <div className="position-relative">
                <Form.Control
                  required
                  value={artistQuery}
                  onChange={(event) => {
                    setArtistQuery(event.target.value);
                    update("artistId", "");
                  }}
                  placeholder={t("searchByArtist")}
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
                    <Button as="button"
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
                    </Button>
                  ))}
                </div>
              )}
            </Form.Group>
            <fieldset className="border rounded p-3 mb-3">
              <legend className="float-none w-auto px-2 fs-6">
                {t("addArtist")}
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
                    placeholder={t("firstName")}
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
                    placeholder={t("middleName")}
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
                    placeholder={t("lastName")}
                  />
                </div>
                <div className="col-md-auto">
                  <Button as="button"
                    type="button"
                    // variant="outline-secondary"
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
                    {t("addArtist")}
                  </Button>
                </div>
              </div>
            </fieldset>
            <Form.Group className="mb-3">
              <Form.Label>{t("category")}</Form.Label>
              <Form.Select
                required
                value={form.categoryId}
                onChange={(event) => update("categoryId", event.target.value)}
              >
                <option value="">{t("chooseCategory")}</option>
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
              <Form.Label>{t("uploadLocalImages")}</Form.Label>
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
                  : t("chooseImages")}
              </Form.Text>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>{t("modelUrl")}</Form.Label>
              <Form.Control
                type="url"
                value={form.modelUrl}
                onChange={(event) => update("modelUrl", event.target.value)}
                placeholder={t("modelUrlPlaceholder")}
              />
            </Form.Group>
            <Form.Group className="mb-4">
              <Form.Label>{t("description")}</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={form.description}
                onChange={(event) => update("description", event.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-4">
              <Form.Label>{t("priceEur")}</Form.Label>
              <Form.Control
                required
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(event) => update("price", event.target.value)}
              />
            </Form.Group>
            <Button as="button"
              // size="sm"
              // variant="outline-dark"
               className="btn btn-outline-secondary"
              type="submit"
              disabled={saving}>
              {saveContent}
              {saving ? t("saving") : t("saveAntique")}
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
}
