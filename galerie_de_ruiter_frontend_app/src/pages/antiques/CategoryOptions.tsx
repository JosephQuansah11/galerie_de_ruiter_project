import type { Category } from "@/models/antiques/Antique";

/**
 * The options of a category picker: every main category, then its children as "Main / Child".
 * Shared by the single-piece form and the folder import so both offer the same paths.
 */
export function CategoryOptions({ categories }: { categories: Category[] }) {
  return <>{categories.flatMap((category) => [
    <option key={category.id} value={category.id}>{category.name}</option>,
    ...(category.children ?? []).map((child) => (
      <option key={child.id} value={child.id}>{category.name} / {child.name}</option>
    )),
  ])}</>;
}

/** The label a chosen category id reads as, including its main category for a subcategory. */
export function categoryLabel(categories: Category[], id: string): string | undefined {
  for (const category of categories) {
    if (category.id === id) return category.name;
    const child = (category.children ?? []).find((item) => item.id === id);
    if (child) return `${category.name} / ${child.name}`;
  }
  return undefined;
}
