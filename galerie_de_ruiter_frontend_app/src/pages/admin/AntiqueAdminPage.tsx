import { useEffect, useRef, useState, type FormEvent } from "react";
import { Alert, Form, Modal, Spinner } from "react-bootstrap";
import { Button } from "@/components/ReactButton";
import { JumpToBottom } from "@/components/JumpToBottom";
import { Check, FolderUp, Plus, Search, Trash2, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { deleteAntique as deleteAntiqueRequest, deleteAntiques, deleteAntiqueImage, getAllAntiques, getAllCategories, reorderAntiqueImages, setAntiqueSold as setAntiqueSoldRequest, updateAntique as updateAntiqueRequest, uploadAntiqueImage, uploadAntiqueModel } from "@/apis/backend_api";
import type Antique from "@/models/antiques/Antique";
import type { Category } from "@/models/antiques/Antique";
import { CategoryOptions } from "@/pages/antiques/CategoryOptions";
import { subscribeToContentUpdates } from "@/services/contentUpdates";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/context/LanguageContext";
import { InventoryList } from "./antiques/InventoryList";
import { InventoryHeading } from "./antiques/InventoryHeading";
import { AntiqueImageEditor } from "./antiques/AntiqueImageEditor";
import { ImageFormatAdmin } from "./antiques/ImageFormatAdmin";
import { DescriptionLimitHint } from "../antiques/DescriptionLimitHint";
import { descriptionIsTooLong } from "../antiques/descriptionLimits";
import { MODEL_MAX_SIZE_MB, isUploadableModel } from "../antiques/modelUploadLimits";
import { useAntiqueImageEditing } from "./antiques/useAntiqueImageEditing";
import { managementErrorKey, modelUploadErrorKey } from "../antiques/antiqueSaveErrors";

/** Finds the category a piece already shows, matching both the plain name and `Main / Child`. */
function categoryIdForLabel(categories: Category[], label?: string | null): string {
  if (!label) return "";
  for (const category of categories) {
    if (category.name === label) return category.id;
    for (const child of category.children ?? []) {
      if (child.name === label || `${child.parentName ?? category.name} / ${child.name}` === label) {
        return child.id;
      }
    }
  }
  return "";
}

export default function AntiqueAdminPage() {
  const { t } = useTranslation();
  const { locale } = useLanguage();
  const navigate = useNavigate();
  const [antiques, setAntiques] = useState<Antique[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [query, setQuery] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [editing, setEditing] = useState<Antique>();
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editCategoryId, setEditCategoryId] = useState("");
  const [editModelFile, setEditModelFile] = useState<File>();
  const [modelFileInvalid, setModelFileInvalid] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingId, setDeletingId] = useState<string>();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [soldSavingId, setSoldSavingId] = useState<string>();
  const [actionError, setActionError] = useState<string>();
  // The piece's photographs: stored and freshly picked in one order the admin can change.
  const editingImages = useAntiqueImageEditing();
  useEffect(() => {
    getAllAntiques()
      .then((items) => { setAntiques(items); setLoadError(false); })
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    getAllCategories().then(setCategories).catch(() => undefined);
  }, []);
  // A piece changed in another tab or by an import is fetched again rather than requiring a reload.
  useEffect(() => subscribeToContentUpdates("antiques", () => {
    getAllAntiques().then((items) => { setAntiques(items); setLoadError(false); }).catch(() => setLoadError(true));
  }), []);
  const filtered = antiques.filter((antique) =>
    antique.title.toLowerCase().includes(query.toLowerCase()),
  );
  const allFilteredSelected = filtered.length > 0 && filtered.every((antique) => selectedIds.has(antique.id));
  const toggleSelected = (id: string, selected: boolean) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (selected) next.add(id);
      else next.delete(id);
      return next;
    });
  };
  const toggleAllFiltered = (selected: boolean) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      for (const antique of filtered) {
        if (selected) next.add(antique.id);
        else next.delete(antique.id);
      }
      return next;
    });
  };
  const openEdit = (antique: Antique) => {
    setEditing(antique);
    setEditTitle(antique.title);
    setEditDescription(antique.description ?? "");
    setEditPrice(antique.price == null ? "" : String(antique.price));
    setEditCategoryId(categoryIdForLabel(categories, antique.category));
    setEditModelFile(undefined);
    setModelFileInvalid(false);
    editingImages.load(antique.imageUrls ?? []);
    setActionError(undefined);
  };
  const descriptionTooLong = descriptionIsTooLong(editDescription);
  const saveEdit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editing) return;
    setSavingEdit(true);
    setActionError(undefined);
    try {
      let updated = await updateAntiqueRequest(editing.id, {
        title: editTitle.trim(),
        description: editDescription,
        price: Number(editPrice),
        categoryId: editCategoryId || undefined,
      });
      if (editModelFile) {
        try {
          updated = await uploadAntiqueModel(editing.id, editModelFile);
        } catch (error) {
          // The details were saved and only the model is missing. Claiming "the antique
          // could not be updated" here is what made the old message so misleading.
          setActionError(modelUploadErrorKey(error));
          return;
        }
      }
      // Photographs: remove the ones the admin deleted, upload the new ones, then store the
      // order the dialog shows — the first photograph becomes the piece's main image.
      try {
        for (const imageId of editingImages.removedImageIds) await deleteAntiqueImage(editing.id, imageId);
        const uploadedByKey = new Map<string, string>();
        for (const image of editingImages.images) {
          if (!image.file) continue;
          const created = await uploadAntiqueImage(editing.id, image.file);
          uploadedByKey.set(image.key, created.id);
        }
        const order = editingImages.images
          .map((image) => image.imageId ?? uploadedByKey.get(image.key))
          .filter((imageId): imageId is string => Boolean(imageId));
        if (order.length > 0) await reorderAntiqueImages(editing.id, order);
      } catch (error) {
        setActionError(managementErrorKey(error));
        return;
      }
      setAntiques((current) => current.map((antique) => antique.id === updated.id ? updated : antique));
      setEditing(undefined);
      // Reload so the list shows the photographs that were just added or removed.
      void getAllAntiques().then((items) => setAntiques(items)).catch(() => undefined);
    } catch (error) {
      setActionError(managementErrorKey(error));
    } finally {
      setSavingEdit(false);
    }
  };
  const removeAntique = async (antique: Antique) => {
    if (!window.confirm(t("confirmDeleteAntique", { name: antique.title }))) return;
    setDeletingId(antique.id);
    setActionError(undefined);
    try {
      await deleteAntiqueRequest(antique.id);
      setAntiques((current) => current.filter((item) => item.id !== antique.id));
      setSelectedIds((current) => {
        const next = new Set(current);
        next.delete(antique.id);
        return next;
      });
    } catch (error) {
      setActionError(managementErrorKey(error));
    } finally {
      setDeletingId(undefined);
    }
  };
  /** Removes every ticked piece in one request; the list waits in the meantime. */
  const removeSelected = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(t("confirmDeleteSelectedAntiques", { count: selectedIds.size }))) return;
    setBulkDeleting(true);
    setActionError(undefined);
    try {
      await deleteAntiques([...selectedIds]);
      setAntiques((current) => current.filter((item) => !selectedIds.has(item.id)));
      setSelectedIds(new Set());
    } catch (error) {
      setActionError(managementErrorKey(error));
    } finally {
      setBulkDeleting(false);
    }
  };
  const toggleSold = async (antique: Antique) => {
    setSoldSavingId(antique.id);
    setActionError(undefined);
    try {
      const updated = await setAntiqueSoldRequest(antique.id, !antique.sold);
      setAntiques((current) => current.map((item) => item.id === updated.id ? updated : item));
    } catch (error) {
      setActionError(managementErrorKey(error));
    } finally {
      setSoldSavingId(undefined);
    }
  };
  return (
    <section className="admin-page">
      <InventoryHeading administration={t("administration")} title={t("antiqueInventory")} />
      <ImageFormatAdmin />
      <div className="inventory-toolbar">
        <form className="inventory-search" role="search" onSubmit={(event) => event.preventDefault()}>
          <span className="inventory-search-icon" aria-hidden="true"><Search size={17} /></span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("searchInventory")}
            aria-label={t("searchInventory")}
          />
          {query.length > 0 && <button type="button" className="inventory-search-clear" aria-label={t("clearSearch")}
            onClick={() => setQuery("")}>
            <X size={16} aria-hidden="true" />
          </button>}
          <button type="submit" className="inventory-search-submit">
            <Search size={16} aria-hidden="true" /><span>{t("search")}</span>
          </button>
        </form>
        <Link className="btn btn-outline-secondary inventory-add-button" to="/admin/antiques/import">
          <FolderUp size={16} /> {t("importFolder")}
        </Link>
        <Button as="button" className="btn btn-outline-danger inventory-add-button" disabled={selectedIds.size === 0 || bulkDeleting}
          onClick={() => void removeSelected()}>
          {bulkDeleting ? <Spinner animation="border" size="sm" /> : <Trash2 size={16} />}
          {t("deleteSelectedAntiques", { count: selectedIds.size })}
        </Button>
        <Button as="button" className="btn btn-primary inventory-add-button" onClick={() => navigate("/admin/antiques/new")}>
          <Plus size={16} /> {t("addAntique")}
        </Button>
      </div>
      {actionError && <Alert variant="danger">{t(actionError, { max: MODEL_MAX_SIZE_MB })}</Alert>}
      {!loading && !loadError && <p className="inventory-result-count">
        {t("inventoryResultCount", { filtered: filtered.length, total: antiques.length })}
      </p>}
      {!loading && !loadError && filtered.length > 0 && <div className="inventory-selection">
        <Form.Check id="inventory-select-all" type="checkbox" label={t("selectAllAntiques")}
          checked={allFilteredSelected} disabled={bulkDeleting}
          onChange={(event) => toggleAllFiltered(event.target.checked)} />
      </div>}
      {loading && (
        <div className="catalogue-state">
          <Spinner animation="border" size="sm" /> {t("loadingInventory")}
        </div>
      )}
      {loadError && <Alert variant="danger">{t("antiquesCouldNotLoad")}</Alert>}
      {!loading && !loadError && filtered.length === 0 && (
        <Alert variant="light">{t("noAntiquesFound")}</Alert>
      )}
      {!loading && !loadError && <InventoryList antiques={filtered} listRef={listRef} onEdit={openEdit} onDelete={removeAntique}
        onToggleSold={toggleSold} selectedIds={selectedIds} onSelect={toggleSelected}
        selectLabel={(title) => t("selectAntiqueNamed", { title })} selectDisabled={bulkDeleting}
        deletingId={deletingId} soldSavingId={soldSavingId}
        uncategorized={t("uncategorized")} priceOnRequest={t("priceOnRequest")}
        locale={locale} editLabel={t("editAntique")} deleteLabel={t("deleteAntique")}
        soldLabel={t("sold")} markSoldLabel={t("markSold")} markAvailableLabel={t("markAvailable")} />}
      {!loading && !loadError && filtered.length > 0 && <JumpToBottom itemCount={filtered.length} targetRef={listRef} />}
      <Modal show={Boolean(editing)} onHide={() => !savingEdit && setEditing(undefined)} centered>
        <Form onSubmit={saveEdit}>
          <Modal.Header closeButton={!savingEdit}>
            <Modal.Title>{t("editAntique")}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {actionError && <Alert variant="danger">{t(actionError, { max: MODEL_MAX_SIZE_MB })}</Alert>}
            <Form.Group className="mb-3" controlId="edit-antique-title">
              <Form.Label>{t("title")}</Form.Label>
              <Form.Control required value={editTitle} onChange={(event) => setEditTitle(event.target.value)} />
            </Form.Group>
            <Form.Group className="mb-3" controlId="edit-antique-description">
              <Form.Label>{t("description")}</Form.Label>
              <Form.Control as="textarea" rows={6} value={editDescription} onChange={(event) => setEditDescription(event.target.value)} />
              <DescriptionLimitHint value={editDescription} />
            </Form.Group>
            <Form.Group className="mb-3" controlId="edit-antique-category">
              <Form.Label>{t("category")}</Form.Label>
              <Form.Select value={editCategoryId} onChange={(event) => setEditCategoryId(event.target.value)}>
                <option value="">{t("uncategorized")}</option>
                <CategoryOptions categories={categories} />
              </Form.Select>
            </Form.Group>
            <AntiqueImageEditor
              images={editingImages.images}
              onAddImages={(files) => { if (editingImages.addFiles(files)) setActionError(undefined); }}
              onMove={editingImages.move}
              onRemove={editingImages.remove}
              disabled={savingEdit}
            />
            <Form.Group className="mb-3" controlId="edit-antique-model">
              <Form.Label>{t("uploadGlbModel")}</Form.Label>
              <Form.Control type="file" accept=".glb,model/gltf-binary" onChange={(event) => {
                const input = event.currentTarget as HTMLInputElement;
                const file = input.files?.[0];
                if (file && !isUploadableModel(file)) {
                  setModelFileInvalid(true);
                  setEditModelFile(undefined);
                  input.value = "";
                  return;
                }
                setModelFileInvalid(false);
                setEditModelFile(file);
              }} />
              <Form.Text>{modelFileInvalid ? t("glbUploadInvalid", { max: MODEL_MAX_SIZE_MB }) : editModelFile?.name ?? t("chooseGlbModel", { max: MODEL_MAX_SIZE_MB })}</Form.Text>
            </Form.Group>
            <Form.Group controlId="edit-antique-price">
              <Form.Label>{t("priceEur")}</Form.Label>
              <Form.Control required type="number" min="0" step="0.01" value={editPrice} onChange={(event) => setEditPrice(event.target.value)} />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button className="btn btn-outline-secondary" type="button" disabled={savingEdit} onClick={() => setEditing(undefined)}>
              <X size={16} />{t("cancel")}
            </Button>
            <Button className="btn btn-primary" type="submit" disabled={savingEdit || modelFileInvalid || descriptionTooLong}>
              {savingEdit ? <Spinner size="sm" /> : <Check size={16} />}{t("saveAntique")}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </section>
  );
}
