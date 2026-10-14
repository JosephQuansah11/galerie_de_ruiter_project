/** How many words of a description the catalogue shows before it is trimmed. */
export const DESCRIPTION_PREVIEW_MAX_WORDS = 50;

/**
 * Trims a gallery description to the short preview the catalogue shows. The full story stays
 * on the piece's own page; a list row only needs enough to recognise the object. Words are
 * counted on whitespace, so a multi-line description collapses into one sentence.
 */
export function summarizeDescription(description: string | null | undefined, maxWords = DESCRIPTION_PREVIEW_MAX_WORDS): string {
  const words = (description ?? "").trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return words.join(" ");
  return `${words.slice(0, maxWords).join(" ")}…`;
}
