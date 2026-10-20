import type { Designer } from "@/models/antiques/Antique";
import { titleKey } from "./existingMatching";

const NAME_PARTICLES = new Set([
  "van", "von", "de", "der", "den", "del", "della", "di", "da", "du",
  "la", "le", "les", "ten", "ter", "zu", "zur",
]);

/**
 * Whether the words after "by" read as a person's name rather than the rest of a title.
 * The first word is capitalised, later words may be lowercase particles ("van", "de", …), and a
 * name is at most five words with no digits in it.
 */
function looksLikeArtistName(value: string): boolean {
  const words = value.split(/\s+/).filter(Boolean);
  if (words.length === 0 || words.length > 5 || /\d/.test(value)) return false;
  return words.every((word, index) => {
    const clean = word.replace(/^[("'“‘]+|[)"'”’.,]+$/g, "");
    if (!clean) return false;
    if (index > 0 && NAME_PARTICLES.has(clean.toLowerCase())) return true;
    return /^\p{Lu}/u.test(clean);
  });
}

/**
 * Reads `Title by Artist` from a folder name.
 *
 * <p>The curator sometimes puts the maker in the item folder: `Stoel by John Doe`. The word "by"
 * comes before the name, and the name is always at the end. Only the last " by " counts, so a title
 * that happens to contain the word earlier is left alone. Only a name-shaped suffix is taken, so
 * `The Book by the Sea` stays a title; the row stays editable either way.</p>
 */
export function splitTitleArtist(value: string): { title: string; artistName?: string } {
  const trimmed = value.trim();
  const matches = [...trimmed.matchAll(/\s+by\s+/gi)];
  const last = matches[matches.length - 1];
  if (!last || last.index === undefined) return { title: trimmed };
  const artistName = trimmed.slice(last.index + last[0].length).trim();
  const title = trimmed.slice(0, last.index).trim();
  if (!title || !artistName || !looksLikeArtistName(artistName)) return { title: trimmed };
  return { title, artistName: artistName.replace(/\s+/g, " ") };
}

/** An artist's name in the order the gallery writes it. */
export function designerName(designer?: Designer | null): string {
  if (!designer) return "";
  return [designer.firstName, designer.middleName, designer.lastName]
    .filter((part): part is string => Boolean(part && part.trim()))
    .join(" ")
    .trim();
}

/** The spellings a folder's `by …` name may use for this artist. */
export function designerKeys(designer: Designer): string[] {
  const first = designer.firstName?.trim() ?? "";
  const middle = designer.middleName?.trim() ?? "";
  const last = designer.lastName?.trim() ?? "";
  return [...new Set([
    [first, middle, last].filter(Boolean).join(" "),
    [first, last].filter(Boolean).join(" "),
  ])].filter(Boolean);
}

/** Every artist by name, so a folder's artist can be matched without a search per row. */
export function designerIndex(designers: Designer[]): Map<string, Designer> {
  const index = new Map<string, Designer>();
  for (const designer of designers) {
    for (const key of designerKeys(designer)) index.set(titleKey(key), designer);
  }
  return index;
}

export function designerForName(index: Map<string, Designer>, name?: string): Designer | undefined {
  return name?.trim() ? index.get(titleKey(name)) : undefined;
}

/** The first and last name the designer API needs; a single word cannot be created there. */
export function artistNameParts(name: string): { firstName: string; lastName: string } | undefined {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length < 2) return undefined;
  return { firstName: words[0], lastName: words.slice(1).join(" ") };
}
