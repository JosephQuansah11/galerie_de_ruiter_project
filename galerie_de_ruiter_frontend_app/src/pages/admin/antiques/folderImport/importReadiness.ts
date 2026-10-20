import { descriptionIsTooLong } from "@/pages/antiques/descriptionLimits";
import { titleIsTooLong } from "@/pages/antiques/titleLimits";
import type { Category } from "@/models/antiques/Antique";
import { importDifferences } from "./differences";
import type { ImportGroupDraft } from "./useFolderImport";

/** Something that still has to be fixed before this row can be imported. */
export type ImportBlocker =
  | "title"
  | "titleLength"
  | "descriptionLength"
  | "price"
  | "artist"
  | "category"
  | "ambiguousExisting"
  | "unconfirmed";

const DETAIL_BLOCKERS: ImportBlocker[] = ["title", "titleLength", "descriptionLength", "price"];

/**
 * The same checks the import button applies, but for one row. The preview uses them to put the
 * rows that are ready in one group and the rows that still need work in another.
 */
export function importBlockers(group: ImportGroupDraft, categories: Category[]): ImportBlocker[] {
  const blockers: ImportBlocker[] = [];
  if (!group.title.trim()) blockers.push("title");
  else if (!group.existing && titleIsTooLong(group.title)) blockers.push("titleLength");
  if (descriptionIsTooLong(group.description)) blockers.push("descriptionLength");

  const price = group.price.trim();
  if (!price) {
    if (!group.existing) blockers.push("price");
  } else if (!Number.isFinite(Number(price)) || Number(price) < 0) {
    blockers.push("price");
  }

  const creatableArtist = Boolean(group.artistName
    && group.artistName.trim().split(/\s+/).filter(Boolean).length >= 2);
  if (!group.existing && !group.artist && !creatableArtist) blockers.push("artist");

  // A known folder path is created by the import, so only a CSV category that matches nothing
  // leaves the row waiting for the curator.
  if (!group.existing && !group.categoryId
      && (group.categoryPath.length === 0 || Boolean(group.category))) {
    blockers.push("category");
  }

  if (group.existingAmbiguous) blockers.push("ambiguousExisting");
  if (group.existing && !group.confirmed
      && importDifferences(group, group.existing, categories).length > 0) {
    blockers.push("unconfirmed");
  }
  return blockers;
}

/** Whether a row can be imported as it stands; saved rows are not ready, they are done. */
export function isImportReady(group: ImportGroupDraft, categories: Category[]): boolean {
  return group.status !== "saved" && importBlockers(group, categories).length === 0;
}

/** Whether a row has a missing title, price or description allowance. */
export function hasDetailBlocker(blockers: ImportBlocker[]): boolean {
  return blockers.some((blocker) => DETAIL_BLOCKERS.includes(blocker));
}
