import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { Alert, Badge, Card, Form, Spinner } from "react-bootstrap";
import { Button } from "@/components/ReactButton";
import { FolderOpen, FileSpreadsheet, Image as ImageIcon, Search, Upload, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArtistSearch } from "@/pages/antiques/ArtistSearch";
import { DesignerCreator } from "@/pages/antiques/DesignerCreator";
import { useDesignerDirectory } from "@/pages/antiques/useDesignerDirectory";
import { ANTIQUE_DESCRIPTION_MAX_LENGTH } from "@/pages/antiques/descriptionLimits";
import { InventoryHeading } from "./antiques/InventoryHeading";
import { useFolderImport, type ImportGroupDraft } from "./antiques/folderImport/useFolderImport";

function artistName(group: ImportGroupDraft): string {
  const artist = group.artist;
  return artist ? [artist.firstName, artist.middleName, artist.lastName].filter(Boolean).join(" ") : "";
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

  useEffect(() => {
    // React has no `webkitdirectory` prop, but the browser reads it from the attribute.
    input.current?.setAttribute("webkitdirectory", "");
    input.current?.setAttribute("directory", "");
  }, []);

  const visible = imported.groups.filter((group) =>
    `${group.title} ${group.label} ${artistName(group)}`.toLowerCase().includes(query.trim().toLowerCase()));
  const selected = imported.groups.filter((group) => group.selected && group.status !== "saved");
  const allVisibleSelected = visible.length > 0
    && visible.every((group) => group.selected || group.status === "saved");
  const missingArtist = selected.some((group) => !group.artist);
  const missingDetails = selected.some((group) =>
    !group.title.trim() || !group.price.trim() || !Number.isFinite(Number(group.price)) || Number(group.price) < 0
    || group.description.length > ANTIQUE_DESCRIPTION_MAX_LENGTH);
  const canImport = selected.length > 0 && !missingArtist && !missingDetails && !imported.importing && !imported.reading;

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

  return <section className="admin-page folder-import-page">
    <InventoryHeading administration={t("administration")} title={t("importFolderTitle")} />
    <p className="folder-import-intro">{t("importFolderIntro")}</p>
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
          onClick={() => { imported.clearFolder(); artistDirectory.setQuery(""); setQuery(""); }}>
          <X size={16} /> {t("clearFolder")}
        </Button>
      </>}
    </div>
    <p className="folder-import-hint">{t("chooseFolderHint")}</p>
    <p className="folder-import-hint">{t("chooseCsvFilesHint")}</p>
    {imported.groups.length === 0 && (imported.csvCount > 0 || imported.folderName) && <div className="folder-import-picker">
      {imported.csvCount > 0 && <span className="folder-import-summary">
        {t("csvFilesSelected", { count: imported.csvCount })}
      </span>}
      <Button className="btn btn-outline-secondary" type="button" disabled={imported.importing || imported.reading}
        onClick={() => { imported.clearFolder(); artistDirectory.setQuery(""); setQuery(""); }}>
        <X size={16} /> {t("clearFolder")}
      </Button>
    </div>}
    <Alert variant="light" className="folder-import-help">{t("importCsvHelp")}</Alert>

    {imported.groups.length > 0 && <Form.Group className="folder-import-grouping" controlId="folder-import-grouping">
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
    </Form.Group>}

    {imported.notice && <Alert variant="warning">{t(imported.notice)}</Alert>}
    {imported.issues.length > 0 && <Alert variant="warning">
      <strong>{t("importIssues")}</strong>
      <ul className="folder-import-issues">
        {imported.issues.map((issue, index) => <li key={`${issue.key}-${index}`}>{t(issue.key, issue.params)}</li>)}
      </ul>
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
      </Card.Body>
    </Card>}

    {imported.groups.length > 0 && <>
      <div className="folder-import-toolbar">
        <div className="folder-import-search">
          <Search size={16} aria-hidden="true" />
          <Form.Control size="sm" value={query} onChange={(event) => setQuery(event.target.value)}
            placeholder={t("searchImportedPieces")} aria-label={t("searchImportedPieces")} />
        </div>
        <Form.Check type="checkbox" id="folder-import-select-all" label={t("selectAllPieces")}
          checked={allVisibleSelected} disabled={visible.length === 0 || imported.importing}
          onChange={(event) => imported.toggleAll(visible.map((group) => group.id), event.target.checked)} />
        <span className="folder-import-selected">{t("selectedPieces", { count: selected.length })}</span>
      </div>

      <div className="folder-import-list">
        {visible.map((group) => {
          const saved = group.status === "saved";
          const disabled = saved || imported.importing;
          return <article className={`folder-import-row${saved ? " is-saved" : ""}`} key={group.id}>
            <Form.Check type="checkbox" checked={group.selected} disabled={disabled}
              aria-label={t("selectPiece", { title: group.title })}
              onChange={(event) => imported.toggleGroup(group.id, event.target.checked)} />
            <img className="folder-import-thumb" src={group.previewUrl} alt="" loading="lazy" />
            <div className="folder-import-fields">
              <Form.Control size="sm" value={group.title} disabled={disabled}
                aria-label={`${t("title")}: ${group.folderName}`}
                onChange={(event) => imported.updateGroup(group.id, "title", event.target.value)} />
              <div className="folder-import-meta">
                <Badge bg={group.record ? "success" : "secondary"}>
                  {group.record ? t("csvMatched") : t("csvMissing")}
                </Badge>
                <span>{t("imagesCount", { count: group.images.length })}</span>
                <span className="folder-import-path" title={group.label}>{group.label}</span>
                <span>{group.artist ? artistName(group) : t("noArtistAssigned")}</span>
                {saved && <Badge bg="success">{t("saved")}</Badge>}
                {group.status === "saving" && <Spinner animation="border" size="sm" />}
              </div>
              <Form.Control as="textarea" rows={2} size="sm" value={group.description} disabled={disabled}
                aria-label={`${t("description")}: ${group.title}`}
                onChange={(event) => imported.updateGroup(group.id, "description", event.target.value)} />
              {group.description.length > ANTIQUE_DESCRIPTION_MAX_LENGTH && <p className="folder-import-error">
                {t("descriptionTooLong", { max: ANTIQUE_DESCRIPTION_MAX_LENGTH })}
              </p>}
              <div className="folder-import-meta">
                <Form.Control className="folder-import-price" size="sm" type="number" min="0" step="0.01"
                  value={group.price} disabled={disabled} placeholder={t("priceEur")}
                  aria-label={`${t("priceEur")}: ${group.title}`}
                  onChange={(event) => imported.updateGroup(group.id, "price", event.target.value)} />
                {group.error && <span className="folder-import-error">{t(group.error)}</span>}
              </div>
            </div>
          </article>;
        })}
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
      {selected.length > 0 && missingDetails && <p className="folder-import-validation">{t("importNeedsDetails")}</p>}
      {imported.progress && <p className="folder-import-progress" role="status">
        {t("importingPieces", imported.progress)}
      </p>}
      {imported.result && <Alert variant={imported.result.failed > 0 ? "warning" : "success"}>
        {imported.result.failed > 0
          ? t("importPartial", { created: imported.result.imported, failed: imported.result.failed })
          : t("importComplete", { count: imported.result.imported })}
      </Alert>}
    </>}
  </section>;
}
