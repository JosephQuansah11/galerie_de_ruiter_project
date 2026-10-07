import { useEffect, useState, type FormEvent } from "react";
import { Alert, Form, Modal, Spinner } from "react-bootstrap";
import { Button } from "@/components/ReactButton";
import { Check, Plus, Search, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { deleteAntique as deleteAntiqueRequest, getAllAntiques, updateAntique as updateAntiqueRequest } from "@/apis/backend_api";
import type Antique from "@/models/antiques/Antique";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/context/LanguageContext";
import { InventoryList } from "./antiques/InventoryList";
import { InventoryHeading } from "./antiques/InventoryHeading";

export default function AntiqueAdminPage() {
  const { t } = useTranslation();
  const { locale } = useLanguage();
  const navigate = useNavigate();
  const [antiques, setAntiques] = useState<Antique[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [editing, setEditing] = useState<Antique>();
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingId, setDeletingId] = useState<string>();
  const [actionError, setActionError] = useState(false);
  useEffect(() => {
    getAllAntiques()
      .then((items) => { setAntiques(items); setLoadError(false); })
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  }, []);
  const filtered = antiques.filter((antique) =>
    antique.title.toLowerCase().includes(query.toLowerCase()),
  );
  const openEdit = (antique: Antique) => {
    setEditing(antique);
    setEditTitle(antique.title);
    setEditDescription(antique.description ?? "");
    setEditPrice(antique.price == null ? "" : String(antique.price));
    setActionError(false);
  };
  const saveEdit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editing) return;
    setSavingEdit(true);
    setActionError(false);
    try {
      const updated = await updateAntiqueRequest(editing.id, {
        title: editTitle.trim(),
        description: editDescription,
        price: Number(editPrice),
      });
      setAntiques((current) => current.map((antique) => antique.id === updated.id ? updated : antique));
      setEditing(undefined);
    } catch {
      setActionError(true);
    } finally {
      setSavingEdit(false);
    }
  };
  const removeAntique = async (antique: Antique) => {
    if (!window.confirm(t("confirmDeleteAntique", { name: antique.title }))) return;
    setDeletingId(antique.id);
    setActionError(false);
    try {
      await deleteAntiqueRequest(antique.id);
      setAntiques((current) => current.filter((item) => item.id !== antique.id));
    } catch {
      setActionError(true);
    } finally {
      setDeletingId(undefined);
    }
  };
  return (
    <section className="admin-page">
      <InventoryHeading administration={t("administration")} title={t("antiqueInventory")} />
      <div className="inventory-toolbar">
        <div className="inventory-search" role="search">
          <Search size={17} aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("searchInventory")}
            aria-label={t("searchInventory")}
          />
        </div>
        <Button as="button" className="btn btn-primary inventory-add-button" onClick={() => navigate("/admin/antiques/new")}>
          <Plus size={16} /> {t("addAntique")}
        </Button>
      </div>
      {actionError && <Alert variant="danger">{t("antiqueManagementActionFailed")}</Alert>}
      {!loading && !loadError && <p className="inventory-result-count">{filtered.length} / {antiques.length}</p>}
      {loading && (
        <div className="catalogue-state">
          <Spinner animation="border" size="sm" /> {t("loadingInventory")}
        </div>
      )}
      {loadError && <Alert variant="danger">{t("antiquesCouldNotLoad")}</Alert>}
      {!loading && !loadError && filtered.length === 0 && (
        <Alert variant="light">{t("noAntiquesFound")}</Alert>
      )}
      {!loading && !loadError && <InventoryList antiques={filtered} onEdit={openEdit} onDelete={removeAntique}
        deletingId={deletingId} uncategorized={t("uncategorized")} priceOnRequest={t("priceOnRequest")}
        locale={locale} editLabel={t("editAntique")} deleteLabel={t("deleteAntique")} />}
      <Modal show={Boolean(editing)} onHide={() => !savingEdit && setEditing(undefined)} centered>
        <Form onSubmit={saveEdit}>
          <Modal.Header closeButton={!savingEdit}>
            <Modal.Title>{t("editAntique")}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {actionError && <Alert variant="danger">{t("antiqueManagementActionFailed")}</Alert>}
            <Form.Group className="mb-3">
              <Form.Label>{t("title")}</Form.Label>
              <Form.Control required value={editTitle} onChange={(event) => setEditTitle(event.target.value)} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>{t("description")}</Form.Label>
              <Form.Control as="textarea" rows={4} value={editDescription} onChange={(event) => setEditDescription(event.target.value)} />
            </Form.Group>
            <Form.Group>
              <Form.Label>{t("priceEur")}</Form.Label>
              <Form.Control required type="number" min="0" step="0.01" value={editPrice} onChange={(event) => setEditPrice(event.target.value)} />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button className="btn btn-outline-secondary" type="button" disabled={savingEdit} onClick={() => setEditing(undefined)}>
              <X size={16} />{t("cancel")}
            </Button>
            <Button className="btn btn-primary" type="submit" disabled={savingEdit}>
              {savingEdit ? <Spinner size="sm" /> : <Check size={16} />}{t("saveAntique")}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </section>
  );
}
