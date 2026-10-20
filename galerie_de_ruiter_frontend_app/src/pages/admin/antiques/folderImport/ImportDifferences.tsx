import { Form } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import type { ImportDifference, ImportField } from "./differences";
import type { ImportGroupDraft } from "./useFolderImport";

type Props = {
  group: ImportGroupDraft;
  /** The fields where the folder or its CSV differs from the piece already in the gallery. */
  differences: ImportDifference[];
  disabled?: boolean;
  onOverride: (field: ImportField, override: boolean) => void;
  onConfirm: (confirmed: boolean) => void;
  onAddImages: (addImages: boolean) => void;
};

/**
 * The comparison between one imported piece and the piece already in the gallery.
 *
 * <p>Nothing is overwritten without this: each differing field shows what the gallery has and what
 * the import brings, the admin ticks the ones that may replace it, and confirms they looked. A
 * piece with no differences simply says so, and the photographs are a separate choice because
 * adding a picture is not the same as replacing a value.</p>
 */
export function ImportDifferences({ group, differences, disabled, onOverride, onConfirm, onAddImages }: Props) {
  const { t } = useTranslation();
  if (!group.existing) return null;
  const existingImages = group.existing.imageUrls?.length ?? 0;

  return <div className="folder-import-diff">
    <p className="folder-import-diff-title">{t("importCompareTitle")}</p>
    {differences.length === 0
      ? <p className="folder-import-hint">{t("importNoDifferences")}</p>
      : <>
        <ul className="folder-import-diff-list">
          {differences.map((difference) => <li className="folder-import-diff-item" key={difference.field}>
            <Form.Check type="checkbox" id={`import-override-${group.id}-${difference.field}`}
              checked={Boolean(group.overrides[difference.field])} disabled={disabled}
              label={t("importOverrideField", { field: t(`importField_${difference.field}`) })}
              onChange={(event) => onOverride(difference.field, event.target.checked)} />
            <dl className="folder-import-diff-values">
              <div>
                <dt>{t("importCurrentValue")}</dt>
                <dd>{difference.current || t("importEmptyValue")}</dd>
              </div>
              <div>
                <dt>{t("importIncomingValue")}</dt>
                <dd>{difference.incoming || t("importEmptyValue")}</dd>
              </div>
            </dl>
          </li>)}
        </ul>
        <Form.Check type="checkbox" id={`import-confirm-${group.id}`} className="folder-import-diff-confirm"
          checked={group.confirmed} disabled={disabled}
          label={t("importConfirmDifferences")}
          onChange={(event) => onConfirm(event.target.checked)} />
      </>}
    {group.images.length > 0 && <Form.Check type="checkbox" id={`import-images-${group.id}`}
      checked={group.addImages} disabled={disabled}
      label={t("importAddImages", { count: group.images.length, existing: existingImages })}
      onChange={(event) => onAddImages(event.target.checked)} />}
  </div>;
}
