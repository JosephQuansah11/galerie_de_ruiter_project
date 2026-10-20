import type Antique from "@/models/antiques/Antique";

/**
 * A title is the identity the curator already uses: folders and CSV rows name a piece by its title,
 * and the same piece can arrive in more than one folder. Case, accents and punctuation are not
 * meaningful, so "Carved mirror", "Carved Mirror" and "Carved  mirror" are one title.
 */
export function titleKey(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .toLowerCase();
}

/** Existing pieces grouped by their normalised title; a title may occur more than once. */
export function existingIndex(antiques: Antique[]): Map<string, Antique[]> {
  const index = new Map<string, Antique[]>();
  for (const antique of antiques) {
    const key = titleKey(antique.title);
    if (!key) continue;
    const matches = index.get(key) ?? [];
    matches.push(antique);
    index.set(key, matches);
  }
  return index;
}

/**
 * The existing piece an imported title names, if the match is unambiguous. Two existing pieces with
 * the same title are not guessed between: that would update the wrong inventory row.
 */
export function matchExisting(index: Map<string, Antique[]>, title: string): {
  existing?: Antique;
  ambiguous: boolean;
} {
  const matches = index.get(titleKey(title)) ?? [];
  return {
    existing: matches.length === 1 ? matches[0] : undefined,
    ambiguous: matches.length > 1,
  };
}
