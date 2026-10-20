/**
 * Maximum number of words the API accepts for an antique description. The same limit is
 * enforced by `DescriptionLimits`/`@MaxWords` on the backend.
 */
export const ANTIQUE_DESCRIPTION_MAX_WORDS = 5000;

/**
 * Counts whitespace-separated words, the same way the API does. An empty description
 * counts as zero; punctuation alone does not create a word.
 */
export function descriptionWordCount(value?: string | null): number {
  const text = (value ?? "").trim();
  return text ? text.split(/\s+/).length : 0;
}

/** Whether a description has more words than the gallery accepts. */
export function descriptionIsTooLong(value?: string | null): boolean {
  return descriptionWordCount(value) > ANTIQUE_DESCRIPTION_MAX_WORDS;
}
