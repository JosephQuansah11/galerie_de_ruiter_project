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
 * offers either level. Picking a main category answers for its whole branch - the pieces filed on
 * the main category itself and the pieces filed under any of its subcategories - and picking a
 * subcategory answers for that subcategory alone, whichever form its label is written in.
 */
function matchesCategoryLabel(value: string | null | undefined, wanted: string): boolean {
  if (!value) return false;
  const needle = wanted.trim().toLowerCase();
  const label = value.toLowerCase();
  return label === needle
    || label.startsWith(`${needle} / `)
    || label.endsWith(` / ${needle}`);
}

