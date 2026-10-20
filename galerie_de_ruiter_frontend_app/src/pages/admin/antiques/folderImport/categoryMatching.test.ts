import type { Category } from "@/models/antiques/Antique";
import { categoryIdFor, categoryNameKey, flattenAllCategories, matchCategory, matchCategoryPath } from "./categoryMatching";

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

describe("matching the category folders above a piece", () => {
  it("uses a main category and its child when the folders name both", () => {
    expect(matchCategoryPath(["Mirrors", "Wall mirrors"], categories)).toEqual({
      mainName: "Mirrors", subName: "Wall mirrors", label: "Mirrors / Wall mirrors", id: "wall", missing: false,
    });
  });

  it("uses a single folder as the main category", () => {
    expect(matchCategoryPath(["Lighting"], categories)).toMatchObject({
      mainName: "Lighting", label: "Lighting", id: "lighting", missing: false,
    });
  });

  it("marks a path the gallery does not have as missing", () => {
    expect(matchCategoryPath(["Boeken", "Antiek"], categories)).toEqual({
      mainName: "Boeken", subName: "Antiek", label: "Boeken / Antiek", missing: true,
    });
    expect(matchCategoryPath(["Mirrors", "Floor mirrors"], categories)).toEqual({
      mainName: "Mirrors", subName: "Floor mirrors", label: "Mirrors / Floor mirrors", missing: true,
    });
  });

  it("ignores case, accents and extra levels beyond the two the gallery has", () => {
    expect(matchCategoryPath(["  mirrors ", "WALL MIRRORS", "Extra"], categories)).toMatchObject({
      id: "wall", label: "Mirrors / Wall mirrors", missing: false,
    });
  });

  it("names no category for an empty path", () => {
    expect(matchCategoryPath([], categories)).toEqual({ mainName: "", label: "", missing: false });
  });
});

describe("reusing categories during an import", () => {
  it("keys a name by its parent, so two children may share a name under different mains", () => {
    expect(categoryNameKey("Shared", "a")).not.toBe(categoryNameKey("Shared", "b"));
    expect(categoryNameKey("Shared", "a")).toBe(categoryNameKey("  shared ", "a"));
  });

  it("flattens the admin list without duplicating a child that is also nested", () => {
    const all = [
      category("mirrors", "Mirrors", [category("wall", "Wall mirrors")]),
      { ...category("wall", "Wall mirrors"), parentId: "mirrors" },
    ];

    expect(flattenAllCategories(all).map((entry) => entry.id).sort()).toEqual(["mirrors", "wall"]);
  });
});
