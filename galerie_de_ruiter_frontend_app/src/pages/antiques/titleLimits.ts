/**
 * Maximum number of words the API accepts for a new piece's title. The same limit is enforced
 * by `TitleLimits`/`@MaxWords` on the backend's create request.
 */
export const ANTIQUE_TITLE_MAX_WORDS = 10;

/** Counts whitespace-separated words, the same way the API does. */
export function titleWordCount(value?: string | null): number {
  const text = (value ?? "").trim();
  return text ? text.split(/\s+/).length : 0;
}

/** Whether a title has more words than the gallery accepts for a new piece. */
export function titleIsTooLong(value?: string | null): boolean {
  return titleWordCount(value) > ANTIQUE_TITLE_MAX_WORDS;
}
