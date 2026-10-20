import type { Category } from "@/models/antiques/Antique";
import { titleKey } from "./existingMatching";

/**
 * Matches the category a spreadsheet names to one of the gallery's category records.
 *
 * A category can be written as the main category (`Mirrors`), a child (`Wall mirrors`) or the full
 * path (`Mirrors / Wall mirrors`, `Mirrors > Wall mirrors`). Accents, case and the separator do not
 * matter; what does matter is ambiguity - two subcategories with the same name under different
 * parents are left for the admin to choose rather than guessed at.
 */
export type CategoryMatch =
  | { status: "matched"; id: string; label: string }
  | { status: "ambiguous" }
  | { status: "unknown" }
  | { status: "empty" };

type FlatCategory = { id: string; name: string; label: string };

/** The categories as one list: every main category followed by its children. */
export function flattenCategories(categories: Category[]): FlatCategory[] {
  return categories.flatMap((category) => [
    { id: category.id, name: category.name, label: category.name },
    ...(category.children ?? []).map((child) => ({
      id: child.id,
      name: child.name,
      label: `${category.name} / ${child.name}`,
    })),
  ]);
}

function key(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s*(?:>|\/|–|—|-)\s*/g, " / ")
    .replace(/\s+/g, " ")
    .trim();
}

export function matchCategory(value: string | undefined, categories: Category[]): CategoryMatch {
  const query = key(value ?? "");
  if (!query) return { status: "empty" };
  const flat = flattenCategories(categories);
  const byLabel = flat.filter((category) => key(category.label) === query);
  if (byLabel.length === 1) return { status: "matched", id: byLabel[0].id, label: byLabel[0].label };
  if (byLabel.length > 1) return { status: "ambiguous" };
  const byName = flat.filter((category) => key(category.name) === query);
  if (byName.length === 1) return { status: "matched", id: byName[0].id, label: byName[0].label };
  if (byName.length > 1) return { status: "ambiguous" };
  return { status: "unknown" };
}

/** The id the import draft starts with, or an empty string when the CSV named no known category. */
export function categoryIdFor(value: string | undefined, categories: Category[]): string {
  const match = matchCategory(value, categories);
  return match.status === "matched" ? match.id : "";
}

/**
 * The category folders a piece sits in, matched to the gallery's records.
 *
 * <p>The gallery's categories have two levels - a main category and its children - so at most the
 * first two folder names are used. `Boeken / Antiek` becomes the child "Antiek" under the main
 * category "Boeken"; a single `Boeken` becomes the main category itself. When either level is not
 * there yet, `missing` is true and the import creates it before assigning the piece.</p>
 */
export type CategoryPathMatch = {
  /** The existing category to file the piece under, when both levels are known. */
  id?: string;
  /** The main category's name, as the folders spell it. */
  mainName: string;
  /** The subcategory's name, when the folders name one. */
  subName?: string;
  /** How the path reads to the curator: the gallery's own spelling where it exists. */
  label: string;
  /** True when at least one level does not exist yet. */
  missing: boolean;
};

export function matchCategoryPath(path: string[], categories: Category[]): CategoryPathMatch {
  const names = path.map((part) => part.trim()).filter(Boolean);
  if (names.length === 0) return { mainName: "", label: "", missing: false };
  const [mainName, subName] = names;
  const main = categories.find((category) => titleKey(category.name) === titleKey(mainName));
  if (!main) return { mainName, subName, missing: true, label: [mainName, subName].filter(Boolean).join(" / ") };
  if (!subName) return { mainName, id: main.id, missing: false, label: main.name };
  const sub = (main.children ?? []).find((child) => titleKey(child.name) === titleKey(subName));
  if (!sub) return { mainName, subName, missing: true, label: `${main.name} / ${subName}` };
  return { mainName, subName, id: sub.id, missing: false, label: `${main.name} / ${sub.name}` };
}

/**
 * Every category in one list, without duplicates.
 *
 * <p>The admin endpoint returns one response per row, and a parent also nests its visible
 * children - so the same child can arrive twice. Rebuilding by id makes the list safe to search
 * for a name that already exists, including a hidden category the public list does not show.</p>
 */
export function flattenAllCategories(categories: Category[]): Category[] {
  const byId = new Map<string, Category>();
  for (const category of categories) {
    byId.set(category.id, category);
    for (const child of category.children ?? []) byId.set(child.id, child);
  }
  return [...byId.values()];
}

/** The key that identifies a category name under its parent, for reuse during one import. */
export function categoryNameKey(name: string, parentId?: string | null): string {
  return `${parentId ?? ""}\u0000${titleKey(name)}`;
}
