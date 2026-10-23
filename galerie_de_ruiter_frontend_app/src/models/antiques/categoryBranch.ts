import type { Category } from "./Antique";

/**
 * How many pieces a category answers for: its own plus every piece filed under one of its
 * subcategories.
 *
 * The catalogue filter shows the whole branch once a main category is picked (see
 * `matchesAntiqueQuery`), so the count printed beside that category has to be the branch's total.
 * The API counts one row at a time, and a main category usually holds nothing itself, so its own
 * count alone would read as an empty category next to a full list of pieces.
 */
export function branchItemCount(category: Category): number {
  return (category.itemCount ?? 0)
    + (category.children ?? []).reduce((total, child) => total + branchItemCount(child), 0);
}
