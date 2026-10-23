import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { Alert, Badge, Card, Form, Spinner } from "react-bootstrap";
import { Button } from "@/components/ReactButton";
import { FolderOpen, FileSpreadsheet, Image as ImageIcon, Save, Search, Tags, Upload, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArtistSearch } from "@/pages/antiques/ArtistSearch";
import { CategoryOptions } from "@/pages/antiques/CategoryOptions";
import { DesignerCreator } from "@/pages/antiques/DesignerCreator";
import { useDesignerDirectory } from "@/pages/antiques/useDesignerDirectory";
import { InventoryHeading } from "./antiques/InventoryHeading";
import { useFolderImport, type ImportGroupDraft } from "./antiques/folderImport/useFolderImport";
import type { ImportCategorySource } from "./antiques/folderImport/buildImportGroups";
import { hasDetailBlocker, importBlockers } from "./antiques/folderImport/importReadiness";
import { FolderImportRow } from "./antiques/folderImport/FolderImportRow";

/** The artist text the preview search matches, including an existing piece's artist. */
function artistSearchName(group: ImportGroupDraft): string {
  const artist = group.artist;
  if (artist) return [artist.firstName, artist.middleName, artist.lastName].filter(Boolean).join(" ");
  const existing = group.existing?.artist;
  return existing?.displayName ?? existing?.name
    ?? [existing?.firstName, existing?.middleName, existing?.lastName].filter(Boolean).join(" ");
}

/**
 * Imports a folder of photographs in one pass.
 *
 * The browser's folder picker hands over every file under the chosen directory, subfolders
 * included. The preview is built in the browser, so the admin sees the CSV match for each piece,
 * can correct a title or price, select a group of rows and give them one artist before anything is
 * created on the server.
 */
export default function AntiqueFolderImportPage() {
  const { t } = useTranslation();
  const imported = useFolderImport();
  const artistDirectory = useDesignerDirectory(imported.assignArtist);
  const input = useRef<HTMLInputElement>(null);
  const csvInput = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [matchFilter, setMatchFilter] = useState<"all" | "csvPath" | "csvTitle" | "folder">("all");
  const [categoryChoice, setCategoryChoice] = useState("");

  useEffect(() => {
    // React has no `webkitdirectory` prop, but the browser reads it from the attribute.
    input.current?.setAttribute("webkitdirectory", "");
    input.current?.setAttribute("directory", "");
  }, []);

  const visible = imported.groups.filter((group) =>
    `${group.title} ${group.label} ${artistSearchName(group)}`.toLowerCase().includes(query.trim().toLowerCase())
    && (matchFilter === "all" || group.match === matchFilter));
  const selected = imported.groups.filter((group) => group.selected && group.status !== "saved");
  const allVisibleSelected = visible.length > 0
    && visible.every((group) => group.selected || group.status === "saved");
  // The same per-row checks decide the two groups below and whether the import button is enabled.
  const blockersByGroup = new Map(imported.groups.map((group) => [
    group.id, importBlockers(group, imported.categories),
  ]));
  const selectedBlockers = new Set(selected.flatMap((group) => blockersByGroup.get(group.id) ?? []));
  const missingArtist = selectedBlockers.has("artist");
  const missingCategory = selectedBlockers.has("category");
  const missingDetails = hasDetailBlocker([...selectedBlockers]);
  const ambiguousExisting = selectedBlockers.has("ambiguousExisting");
  const unconfirmed = selectedBlockers.has("unconfirmed");
  // A folder category that exists nowhere is created by the import; this is the list the curator
  // sees before pressing the button. An existing piece only counts when its category was ticked.
  const categoriesToCreate = [...new Set(selected
    .filter((group) => !group.categoryId && !group.category && group.categoryPath.length > 0
      && (!group.existing || Boolean(group.overrides.category)))
    .map((group) => group.categoryPath.slice(0, 2).join(" / ")))];
  const readyGroups = visible.filter((group) => group.status !== "saved"
    && (blockersByGroup.get(group.id)?.length ?? 0) === 0);
  const needsWorkGroups = visible.filter((group) => group.status !== "saved"
    && (blockersByGroup.get(group.id)?.length ?? 0) > 0);
  const savedGroups = visible.filter((group) => group.status === "saved");
  const canImport = selected.length > 0 && selectedBlockers.size === 0
    && !imported.importing && !imported.reading
    && !imported.existingLoading && !imported.existingError;

  const chooseFolder = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.currentTarget.files ?? []);
    // The same folder can be picked again after clearing.
    event.currentTarget.value = "";
    artistDirectory.setQuery("");
    void imported.selectFolder(files);
  };

  const chooseCsvFiles = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.currentTarget.files ?? []);
    event.currentTarget.value = "";
    void imported.selectCsvFiles(files);
  };

  const sections = [
    { key: "ready", label: t("importReadyGroup"), badge: "success" as const, groups: readyGroups },
    { key: "needsWork", label: t("importNeedsWorkGroup"), badge: "warning" as const, groups: needsWorkGroups },
    { key: "saved", label: t("importSavedGroup"), badge: "secondary" as const, groups: savedGroups },
  ];

  return <section className="admin-page folder-import-page">
    <InventoryHeading administration={t("administration")} title={t("importFolderTitle")} />
    <p className="folder-import-intro">{t("importFolderIntro")}</p>
    {imported.restoring && imported.groups.length === 0 && <div className="folder-import-hint" role="status">
      <Spinner animation="border" size="sm" /> {t("importSessionRestoring")}
    </div>}
    {imported.restored && <Alert variant="info" dismissible onClose={imported.dismissRestored}>
      {t("importSessionRestored")}
    </Alert>}
    {imported.existingError && <Alert variant="warning">{t(imported.existingError)}</Alert>}
    <input ref={input} type="file" multiple className="visually-hidden" aria-label={t("chooseFolder")}
      onChange={chooseFolder} tabIndex={-1} />
    <input ref={csvInput} type="file" multiple accept=".csv,text/csv" className="visually-hidden"
      aria-label={t("chooseCsvFiles")} onChange={chooseCsvFiles} tabIndex={-1} />

    <div className="folder-import-picker">
      <Button className="btn btn-primary" type="button" disabled={imported.reading || imported.importing}
        onClick={() => input.current?.click()}>
        {imported.reading ? <Spinner animation="border" size="sm" /> : <FolderOpen size={17} />}
        {t("chooseFolder")}
      </Button>
      <Button className="btn btn-outline-secondary" type="button" disabled={imported.reading || imported.importing}
        onClick={() => csvInput.current?.click()}>
        <FileSpreadsheet size={17} /> {t("chooseCsvFiles")}
      </Button>
      {imported.groups.length > 0 && <>
        <span className="folder-import-summary">
          {imported.folderName && <strong>{imported.folderName}</strong>}
          {imported.folderName && " · "}
          {t("folderSummary", { images: imported.imageCount, pieces: imported.groups.length, csv: imported.csvCount })}
        </span>
        <Button className="btn btn-outline-secondary" type="button" disabled={imported.importing || imported.reading}
          onClick={() => { imported.clearFolder(); artistDirectory.setQuery(""); setQuery(""); setCategoryChoice(""); }}>
          <X size={16} /> {t("clearFolder")}
        </Button>
        <Button className="btn btn-outline-secondary" type="button"
          disabled={imported.importing || imported.saveState === "saving"}
          onClick={() => void imported.saveForLater()}>
          {imported.saveState === "saving" ? <Spinner animation="border" size="sm" /> : <Save size={16} />}
          {t("saveImportForLater")}
        </Button>
        {imported.saveState === "saved" && <span className="folder-import-saved">{t("importSavedForLater")}</span>}
        {imported.saveState === "unavailable" && <span className="folder-import-error">{t("importSaveUnavailable")}</span>}
      </>}
    </div>
    <p className="folder-import-hint">{t("chooseFolderHint")}</p>
    <p className="folder-import-hint">{t("chooseCsvFilesHint")}</p>
    {imported.groups.length === 0 && (imported.csvCount > 0 || imported.folderName) && <div className="folder-import-picker">
      {imported.csvCount > 0 && <span className="folder-import-summary">
        {t("csvFilesSelected", { count: imported.csvCount })}
      </span>}
      <Button className="btn btn-outline-secondary" type="button" disabled={imported.importing || imported.reading}
        onClick={() => { imported.clearFolder(); artistDirectory.setQuery(""); setQuery(""); setCategoryChoice(""); }}>
        <X size={16} /> {t("clearFolder")}
      </Button>
    </div>}
    <Alert variant="light" className="folder-import-help">{t("importCsvHelp")}</Alert>

    {imported.groups.length > 0 && <>
      <Form.Group className="folder-import-grouping" controlId="folder-import-grouping">
        <Form.Label>{t("importGrouping")}</Form.Label>
        <div>
          <Form.Check inline type="radio" name="folder-import-grouping" id="folder-import-grouping-folder"
            label={t("onePiecePerFolder")} checked={imported.grouping === "folder"} disabled={imported.importing || imported.reading}
            onChange={() => imported.changeGrouping("folder")} />
          <Form.Check inline type="radio" name="folder-import-grouping" id="folder-import-grouping-image"
            label={t("onePiecePerImage")} checked={imported.grouping === "image"} disabled={imported.importing || imported.reading}
            onChange={() => imported.changeGrouping("image")} />
        </div>
        <Form.Text>{t("importGroupingHint")}</Form.Text>
      </Form.Group>
      <Form.Group className="folder-import-category-source" controlId="folder-import-category-source">
        <Form.Label>{t("importCategorySource")}</Form.Label>
        <Form.Select size="sm" value={imported.categorySource} disabled={imported.importing || imported.reading}
          onChange={(event) => imported.changeCategorySource(event.target.value as ImportCategorySource)}>
          <option value="auto">{t("importCategoryAuto")}</option>
          <option value="chosen">{t("importCategoryChosen")}</option>
          <option value="inside">{t("importCategoryInside")}</option>
        </Form.Select>
        <Form.Text>{t("importCategorySourceHint")}</Form.Text>
      </Form.Group>
    </>}

    {imported.notice && <Alert variant="warning">{t(imported.notice)}</Alert>}
    {(imported.issues.length > 0 || imported.categoryIssues.length > 0) && <Alert variant="warning">
      <strong>{t("importIssues")}</strong>
      <ul className="folder-import-issues">
        {[...imported.issues, ...imported.categoryIssues].map((issue, index) => <li key={`${issue.key}-${index}`}>{t(issue.key, issue.params)}</li>)}
      </ul>
    </Alert>}
    {categoriesToCreate.length > 0 && <Alert variant="info" className="folder-import-new-categories">
      {t("importCategoriesToCreate", {
        count: categoriesToCreate.length,
        categories: categoriesToCreate.join(", "),
      })}
    </Alert>}
    {imported.groups.length === 0 && !imported.reading && imported.folderName && <div className="folder-import-empty">
      <ImageIcon size={26} aria-hidden="true" /><span>{t("importNoImages")}</span>
    </div>}

    {imported.groups.length > 0 && <Card className="folder-import-assign">
      <Card.Body>
        <div className="folder-import-assign-heading">
          <h2>{t("assignArtist")}</h2>
          <Badge bg="secondary">{t("selectedPieces", { count: selected.length })}</Badge>
        </div>
        <p className="folder-import-hint">{t("importArtistHint")}</p>
        <fieldset disabled={imported.importing} className="border-0 p-0">
          <ArtistSearch query={artistDirectory.query} setQuery={artistDirectory.setQuery}
            designers={artistDirectory.designers} choose={artistDirectory.chooseArtist} />
          <DesignerCreator newArtist={artistDirectory.newArtist} setNewArtist={artistDirectory.setNewArtist}
            creating={artistDirectory.creating} addArtist={artistDirectory.addArtist} />
        </fieldset>
        {artistDirectory.error && <Alert variant="danger">{t(artistDirectory.error)}</Alert>}
        <div className="folder-import-category">
          <div className="folder-import-assign-heading">
            <h2>{t("assignCategory")}</h2>
          </div>
          <p className="folder-import-hint">{t("importCategoryHint")}</p>
          <div className="folder-import-category-controls">
            <Form.Select size="sm" value={categoryChoice} disabled={imported.importing || imported.reading}
              aria-label={t("chooseCategory")} onChange={(event) => setCategoryChoice(event.target.value)}>
              <option value="">{t("chooseCategory")}</option>
              <CategoryOptions categories={imported.categories} />
            </Form.Select>
            <Button className="btn btn-outline-secondary" type="button"
              disabled={!categoryChoice || selected.length === 0 || imported.importing}
              onClick={() => imported.assignCategory(categoryChoice)}>
              <Tags size={16} /> {t("assignCategoryAction")}
            </Button>
          </div>
          {imported.categoriesError && <Alert variant="danger">{t(imported.categoriesError)}</Alert>}
        </div>
      </Card.Body>
    </Card>}

    {imported.groups.length > 0 && <>
      <div className="folder-import-toolbar">
        <div className="folder-import-search">
          <Search size={16} aria-hidden="true" />
          <Form.Control size="sm" value={query} onChange={(event) => setQuery(event.target.value)}
            placeholder={t("searchImportedPieces")} aria-label={t("searchImportedPieces")} />
        </div>
        <Form.Select size="sm" className="folder-import-match-filter" value={matchFilter}
          aria-label={t("importMatchFilter")} onChange={(event) => setMatchFilter(event.target.value as typeof matchFilter)}>
          <option value="all">{t("importMatchAll")}</option>
          <option value="csvPath">{t("importMatchCsvPath")}</option>
          <option value="csvTitle">{t("importMatchCsvTitle")}</option>
          <option value="folder">{t("importMatchFolder")}</option>
        </Form.Select>
        <Form.Check type="checkbox" id="folder-import-select-all" label={t("selectAllPieces")}
          checked={allVisibleSelected} disabled={visible.length === 0 || imported.importing}
          onChange={(event) => imported.toggleAll(visible.map((group) => group.id), event.target.checked)} />
        <Button className="btn btn-outline-secondary btn-sm" type="button"
          disabled={readyGroups.length === 0 || imported.importing}
          onClick={() => imported.selectOnly(readyGroups.map((group) => group.id))}>
          {t("selectReadyPieces", { count: readyGroups.length })}
        </Button>
        <span className="folder-import-selected">{t("selectedPieces", { count: selected.length })}</span>
      </div>

      <div className="folder-import-list">
        {sections.filter((section) => section.groups.length > 0).map((section) =>
          <section className={`folder-import-section folder-import-section-${section.key}`} key={section.key}>
            <h3 className="folder-import-section-heading">
              <span>{section.label}</span>
              <Badge bg={section.badge}>{section.groups.length}</Badge>
            </h3>
            <div className="folder-import-rows">
              {section.groups.map((group) => <FolderImportRow key={group.id} group={group} imported={imported} />)}
            </div>
          </section>)}
      </div>
      {visible.length === 0 && <Alert variant="light">{t("noImportedPiecesFound")}</Alert>}

      <div className="folder-import-actions">
        <Button className="btn btn-primary" type="button" disabled={!canImport}
          onClick={() => void imported.importSelected()}>
          {imported.importing ? <Spinner animation="border" size="sm" /> : <Upload size={16} />}
          {t("importPieces", { count: selected.length })}
        </Button>
        <Link className="btn btn-outline-secondary" to="/admin/antiques">{t("viewInventory")}</Link>
      </div>
      {selected.length > 0 && missingArtist && <p className="folder-import-validation">{t("importNeedsArtist")}</p>}
      {selected.length > 0 && missingCategory && <p className="folder-import-validation">{t("importNeedsCategory")}</p>}
      {selected.length > 0 && missingDetails && <p className="folder-import-validation">{t("importNeedsDetails")}</p>}
      {selected.length > 0 && ambiguousExisting && <p className="folder-import-validation">{t("importExistingAmbiguous")}</p>}
      {selected.length > 0 && unconfirmed && <p className="folder-import-validation">{t("importNeedsConfirmation")}</p>}
      {imported.progress && <p className="folder-import-progress" role="status">
        {t("importingPieces", imported.progress)}
      </p>}
      {imported.result && <Alert variant={imported.result.failed > 0 ? "warning" : "success"}>
        {imported.result.failed > 0
          ? t("importPartial", {
            created: imported.result.imported,
            updated: imported.result.updated,
            failed: imported.result.failed,
          })
          : imported.result.updated > 0
            ? t("importCompleteMixed", { created: imported.result.imported, updated: imported.result.updated })
            : t("importComplete", { count: imported.result.imported })}
      </Alert>}
    </>}
  </section>;
}
