import type { Category } from "@/models/antiques/Antique";

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
