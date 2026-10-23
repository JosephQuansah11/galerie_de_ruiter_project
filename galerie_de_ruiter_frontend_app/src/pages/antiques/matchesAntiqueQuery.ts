import type Antique from "@/models/antiques/Antique";

export function matchesAntiqueQuery(
  antique: Antique,
  query: string,
  category: string,
  allPieces: string,
  collectionName: string,
) {
  const queryMatch = !query.trim() || [
    antique.title,
    antique.description,
    antique.artist?.displayName ?? antique.artist?.name ?? collectionName,
    antique.category,
  ].some((text) => text?.toLowerCase().includes(query.trim().toLowerCase()));
  const categoryMatch = !category || category === allPieces
    || matchesCategoryLabel(antique.category, category);
  return queryMatch && categoryMatch;
}

/**
 * A piece carries `Main / Child` once its subcategory has a parent, while the catalogue's filter
 * still offers the child's own name. Either form selects the piece.
 */
function matchesCategoryLabel(value: string | null | undefined, wanted: string): boolean {
  if (!value) return false;
  const needle = wanted.trim().toLowerCase();
  const label = value.toLowerCase();
  return label === needle || label.endsWith(` / ${needle}`);
}
