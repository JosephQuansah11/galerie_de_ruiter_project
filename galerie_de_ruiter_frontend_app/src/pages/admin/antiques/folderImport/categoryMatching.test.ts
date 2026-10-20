import type { Category } from "@/models/antiques/Antique";
import { categoryIdFor, matchCategory } from "./categoryMatching";

function category(id: string, name: string, children: Category[] = []): Category {
  return { id, name, visible: true, itemCount: 0, children };
}

const categories = [
  category("mirrors", "Mirrors", [category("wall", "Wall mirrors"), category("table", "Table mirrors")]),
  category("lighting", "Lighting"),
];

describe("matching a CSV category to the gallery's records", () => {
  it("reads a main category, a child and the full path", () => {
    expect(matchCategory("Mirrors", categories)).toMatchObject({ status: "matched", id: "mirrors" });
    expect(matchCategory("wall mirrors", categories)).toMatchObject({ status: "matched", id: "wall" });
    expect(matchCategory("Mirrors > Wall mirrors", categories)).toMatchObject({ status: "matched", id: "wall" });
    expect(matchCategory("Mirrors / Table mirrors", categories)).toMatchObject({ status: "matched", id: "table" });
  });

  it("ignores case, accents and the separator a spreadsheet uses", () => {
    expect(matchCategory("  MIRRORS — wall MIRRORS ", categories)).toMatchObject({ status: "matched", id: "wall" });
  });

  it("leaves an unknown or ambiguous name for the administrator", () => {
    expect(matchCategory("Sculptures", categories)).toEqual({ status: "unknown" });
    expect(matchCategory("", categories)).toEqual({ status: "empty" });
    expect(matchCategory(undefined, categories)).toEqual({ status: "empty" });

    const shared = [
      category("a", "A", [category("a-shared", "Shared")]),
      category("b", "B", [category("b-shared", "Shared")]),
    ];
    expect(matchCategory("Shared", shared)).toEqual({ status: "ambiguous" });
  });

  it("turns a match into the id an import draft starts with", () => {
    expect(categoryIdFor("Mirrors / Wall mirrors", categories)).toBe("wall");
    expect(categoryIdFor("Unknown", categories)).toBe("");
    expect(categoryIdFor(undefined, categories)).toBe("");
  });
});
