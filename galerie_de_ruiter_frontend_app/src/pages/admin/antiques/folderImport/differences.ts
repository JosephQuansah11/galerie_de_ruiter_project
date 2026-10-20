import type Antique from "@/models/antiques/Antique";
import type { Category, Designer } from "@/models/antiques/Antique";
import { categoryLabel } from "@/pages/antiques/CategoryOptions";
import { titleKey } from "./existingMatching";

/** The fields an import can overwrite on a piece that is already in the gallery. */
export type ImportField = "title" | "description" | "price" | "artist" | "category";

/** One field where the folder or its CSV says something other than the gallery does. */
export type ImportDifference = {
  field: ImportField;
  /** What the piece in the gallery says now. */
  current: string;
  /** What this import brings. */
  incoming: string;
};

/** The imported values the comparison needs; an import row provides all of them. */
export type ImportDraftFields = {
  title: string;
  description: string;
  price: string;
  artist?: Designer;
  /** The artist a folder's `Title by Artist` names, even when the directory has no record yet. */
  artistName?: string;
  categoryId: string;
  /** The category the CSV named, if any. */
  category?: string;
  /** The category folders above the piece, when the folders name one. */
  categoryPath?: string[];
};

type ArtistLike = {
  firstName?: string;
  middleName?: string | null;
  lastName?: string;
  name?: string | null;
  displayName?: string | null;
};

function artistName(artist?: ArtistLike | null): string {
  if (!artist) return "";
  const parts = [artist.firstName, artist.middleName, artist.lastName]
    .filter((part): part is string => Boolean(part && part.trim()))
    .join(" ")
    .trim();
  // The inventory may only know a display name for an artist.
  return parts || artist.displayName?.trim() || artist.name?.trim() || "";
}

/** Case, accents, punctuation and repeated spaces are not a difference worth asking about. */
function sameText(left: string, right: string): boolean {
  return titleKey(left) === titleKey(right);
}

/**
 * What an import would change on an existing piece.
 *
 * <p>A blank import field is not a difference: it means "the CSV did not say", and the existing
 * value must be kept rather than erased. Only values the import actually brings are compared, so
 * the admin is asked about real changes and never about the shape of a spreadsheet.</p>
 *
 * <p>Categories are compared by name because the inventory list names a piece's category rather
 * than identifying it; the update itself still uses the chosen category id.</p>
 */
export function importDifferences(
  draft: ImportDraftFields,
  existing: Antique,
  categories: Category[],
): ImportDifference[] {
  const differences: ImportDifference[] = [];
  const incomingTitle = draft.title.trim();
  if (incomingTitle && !sameText(incomingTitle, existing.title ?? "")) {
    differences.push({ field: "title", current: existing.title ?? "", incoming: incomingTitle });
  }

  const incomingDescription = draft.description.trim();
  if (incomingDescription && !sameText(incomingDescription, existing.description ?? "")) {
    differences.push({
      field: "description",
      current: existing.description ?? "",
      incoming: incomingDescription,
    });
  }

  const incomingPrice = draft.price.trim();
  if (incomingPrice) {
    const price = Number(incomingPrice);
    if (Number.isFinite(price) && price !== (existing.price ?? null)) {
      differences.push({
        field: "price",
        current: existing.price == null ? "" : String(existing.price),
        incoming: incomingPrice,
      });
    }
  }

  const incomingArtist = artistName(draft.artist) || draft.artistName?.trim() || "";
  const artistDiffers = draft.artist?.id
    ? draft.artist.id !== (existing.artist?.id ?? "")
    : Boolean(incomingArtist) && !sameText(incomingArtist, artistName(existing.artist));
  if (artistDiffers) {
    differences.push({
      field: "artist",
      current: artistName(existing.artist),
      incoming: incomingArtist,
    });
  }

  // The gallery's category for the piece: the record the CSV or folders matched, or the path the
  // folders name when it does not exist yet. A missing category is still a difference worth asking
  // about, because taking it means creating the category.
  const incomingCategory = draft.categoryId
    ? categoryLabel(categories, draft.categoryId) ?? ""
    : draft.category?.trim() || draft.categoryPath?.slice(0, 2).join(" / ") || "";
  // Until the category list has loaded there is no name to compare; the import is blocked on a
  // missing category for a new piece anyway, so waiting is safer than inventing a difference.
  if (incomingCategory && !sameText(incomingCategory, existing.category ?? "")) {
    differences.push({
      field: "category",
      current: existing.category ?? "",
      incoming: incomingCategory,
    });
  }

  return differences;
}
