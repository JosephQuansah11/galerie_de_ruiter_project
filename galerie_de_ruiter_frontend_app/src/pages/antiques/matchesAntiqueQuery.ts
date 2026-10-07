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
    || antique.category?.toLowerCase() === category.toLowerCase();
  return queryMatch && categoryMatch;
}
