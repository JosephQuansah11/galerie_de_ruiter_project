import { matchesAntiqueQuery } from "./matchesAntiqueQuery";
import type Antique from "@/models/antiques/Antique";

const allPieces = "All pieces";
const collectionName = "Galerie collection";

/** A piece as the API lists it: a subcategory reads as `Main / Child`. */
function piece(category: string | null, title = "A piece"): Antique {
  return { id: "1", title, category, description: "A story" };
}

describe("Catalogue filtering", () => {
  it("shows the whole branch when a main category is picked", () => {
    expect(matchesAntiqueQuery(piece("Audio - Tv / Decoration"), "", "Audio - Tv", allPieces, collectionName)).toBe(true);
    // A piece filed on the main category itself belongs to the branch too.
    expect(matchesAntiqueQuery(piece("Audio - Tv"), "", "Audio - Tv", allPieces, collectionName)).toBe(true);
    // Another main category stays out of it.
    expect(matchesAntiqueQuery(piece("Mirrors"), "", "Audio - Tv", allPieces, collectionName)).toBe(false);
    expect(matchesAntiqueQuery(piece("Audio - Tv / Decoration"), "", "Mirrors", allPieces, collectionName)).toBe(false);
  });

  it("keeps a subcategory to its own pieces", () => {
    expect(matchesAntiqueQuery(piece("Audio - Tv / Decoration"), "", "Decoration", allPieces, collectionName)).toBe(true);
    // A sibling subcategory is not part of the pick…
    expect(matchesAntiqueQuery(piece("Audio - Tv / Lighting"), "", "Decoration", allPieces, collectionName)).toBe(false);
    // …and a piece whose category carries no parent still answers to its own name.
    expect(matchesAntiqueQuery(piece("Decoration"), "", "Decoration", allPieces, collectionName)).toBe(true);
  });

  it("does not read a partial name as a category", () => {
    expect(matchesAntiqueQuery(piece("Audio - Tv"), "", "Audio", allPieces, collectionName)).toBe(false);
  });

  it("treats \"all pieces\" and an empty choice as no category filter", () => {
    expect(matchesAntiqueQuery(piece("Mirrors"), "", "", allPieces, collectionName)).toBe(true);
    expect(matchesAntiqueQuery(piece("Mirrors"), "", allPieces, allPieces, collectionName)).toBe(true);
  });

  it("still combines the picked category with the search box", () => {
    expect(matchesAntiqueQuery(piece("Audio - Tv / Decoration", "Brass vase"), "vase", "Audio - Tv", allPieces, collectionName)).toBe(true);
    expect(matchesAntiqueQuery(piece("Audio - Tv / Decoration", "Brass vase"), "mirror", "Audio - Tv", allPieces, collectionName)).toBe(false);
    expect(matchesAntiqueQuery(piece("Audio - Tv / Decoration", "Brass vase"), "vase", "Mirrors", allPieces, collectionName)).toBe(false);
  });

  it("keeps a piece without a category out of every category", () => {
    expect(matchesAntiqueQuery(piece(null), "", "Audio - Tv", allPieces, collectionName)).toBe(false);
    expect(matchesAntiqueQuery(piece(null), "", allPieces, allPieces, collectionName)).toBe(true);
  });
});
