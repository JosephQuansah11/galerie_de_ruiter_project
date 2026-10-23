import { Badge, Form, Spinner } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { CategoryOptions, categoryLabel } from "@/pages/antiques/CategoryOptions";
import { ANTIQUE_DESCRIPTION_MAX_WORDS, descriptionIsTooLong } from "@/pages/antiques/descriptionLimits";
import { ANTIQUE_TITLE_MAX_WORDS, titleIsTooLong } from "@/pages/antiques/titleLimits";
import { importDifferences } from "./differences";
import { ImportDifferences } from "./ImportDifferences";
import type { ImportGroupDraft, useFolderImport } from "./useFolderImport";

/** The artist the row shows: the chosen record, else the one an existing piece has. */
function artistName(group: ImportGroupDraft): string {
  const artist = group.artist;
  if (artist) return [artist.firstName, artist.middleName, artist.lastName].filter(Boolean).join(" ");
  const existing = group.existing?.artist;
  return existing?.displayName ?? existing?.name
    ?? [existing?.firstName, existing?.middleName, existing?.lastName].filter(Boolean).join(" ");
}

/**
 * One piece in the import preview. The same row is used in the ready, needs-work and saved
 * sections; the section only decides where it is shown, not what it can do.
 */
export function FolderImportRow({ group, imported }: {
  group: ImportGroupDraft;
  imported: ReturnType<typeof useFolderImport>;
}) {
  const { t } = useTranslation();
  const saved = group.status === "saved";
  const disabled = saved || imported.importing;
  return <article className={`folder-import-row${saved ? " is-saved" : ""}`}>
    <Form.Check type="checkbox" checked={group.selected} disabled={disabled}
      aria-label={t("selectPiece", { title: group.title })}
      onChange={(event) => imported.toggleGroup(group.id, event.target.checked)} />
    <img className="folder-import-thumb" src={group.previewUrl} alt="" loading="lazy" />
    <div className="folder-import-fields">
      <Form.Control size="sm" value={group.title} disabled={disabled}
        aria-label={`${t("title")}: ${group.folderName}`}
        onChange={(event) => imported.updateGroup(group.id, "title", event.target.value)} />
      {!group.existing && titleIsTooLong(group.title) && <p className="folder-import-error">
        {t("titleTooLong", { max: ANTIQUE_TITLE_MAX_WORDS })}
      </p>}
      <Form.Select size="sm" value={group.categoryId} disabled={disabled}
        aria-label={`${t("category")}: ${group.title}`}
        onChange={(event) => imported.updateGroupCategory(group.id, event.target.value)}>
        <option value="">{t("chooseCategory")}</option>
        <CategoryOptions categories={imported.categories} />
      </Form.Select>
      {group.categoryPath.length > 0 && !group.category && <span className="folder-import-folder-category">
        <span>{t("importCategoryFromFolders")}: <strong>{group.categoryPath.slice(0, 2).join(" / ")}</strong></span>
        {!group.categoryId && <Badge bg="warning">{t("importCategoryWillCreate")}</Badge>}
      </span>}
      <div className="folder-import-meta">
        <Badge bg={group.record ? "success" : "secondary"}>
          {group.record ? t("csvMatched") : t("csvMissing")}
        </Badge>
        {group.record && group.match !== "folder" && <Badge bg="light" text="dark">
          {t(group.match === "csvPath" ? "importMatchCsvPath" : "importMatchCsvTitle")}
        </Badge>}
        {group.existing && <Badge bg="info">{t("importWillUpdate")}</Badge>}
        {group.existingAmbiguous && <Badge bg="warning">{t("importExistingAmbiguous")}</Badge>}
        <span>{t("imagesCount", { count: group.images.length })}</span>
        <span className="folder-import-path" title={group.label}>{group.label}</span>
        <span>{group.artist
          ? artistName(group)
          : group.artistName
            ? t("artistFromTitle", { name: group.artistName })
            : t("noArtistAssigned")}</span>
        {!group.artist && group.artistName
          && group.artistName.trim().split(/\s+/).filter(Boolean).length >= 2
          && <Badge bg="warning">{t("importArtistWillCreate")}</Badge>}
        <span>{categoryLabel(imported.categories, group.categoryId)
          ?? (group.categoryPath.join(" / ") || t("noCategoryAssigned"))}</span>
        {saved && <Badge bg="success">{t("saved")}</Badge>}
        {group.status === "saving" && <Spinner animation="border" size="sm" />}
      </div>
      <Form.Control as="textarea" rows={2} size="sm" value={group.description} disabled={disabled}
        aria-label={`${t("description")}: ${group.title}`}
        onChange={(event) => imported.updateGroup(group.id, "description", event.target.value)} />
      {descriptionIsTooLong(group.description) && <p className="folder-import-error">
        {t("descriptionTooLong", { max: ANTIQUE_DESCRIPTION_MAX_WORDS })}
      </p>}
      <div className="folder-import-meta">
        <Form.Control className="folder-import-price" size="sm" type="number" min="0" step="0.01"
          value={group.price} disabled={disabled} placeholder={t("priceEur")}
          aria-label={`${t("priceEur")}: ${group.title}`}
          onChange={(event) => imported.updateGroup(group.id, "price", event.target.value)} />
        {group.error && <span className="folder-import-error">{t(group.error)}</span>}
      </div>
      <ImportDifferences group={group}
        differences={group.existing ? importDifferences(group, group.existing, imported.categories) : []}
        disabled={disabled}
        onOverride={(field, override) => imported.setOverride(group.id, field, override)}
        onConfirm={(confirmed) => imported.confirmGroup(group.id, confirmed)}
        onAddImages={(addImages) => imported.setAddImages(group.id, addImages)} />
    </div>
  </article>;
}
