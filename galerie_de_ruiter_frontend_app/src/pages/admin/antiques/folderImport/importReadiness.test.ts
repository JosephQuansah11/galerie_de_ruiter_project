import { importBlockers, isImportReady, hasDetailBlocker } from "./importReadiness";
import type { ImportGroupDraft } from "./useFolderImport";

function draft(overrides: Partial<ImportGroupDraft> = {}): ImportGroupDraft {
  return {
    id: "piece-1",
    label: "Root/Mirrors/Carved mirror",
    folderName: "Carved mirror",
    images: [],
    title: "Carved mirror",
    description: "",
    price: "480",
    categoryPath: ["Mirrors"],
    match: "folder",
    selected: true,
    categoryId: "cat-mirrors",
    status: "pending",
    uploadedCount: 0,
    previewUrl: "",
    overrides: {},
    confirmed: false,
    addImages: true,
    ...overrides,
  };
}

const categories = [{ id: "cat-mirrors", name: "Mirrors", visible: true, itemCount: 1, children: [] }];

describe("whether an import row is ready", () => {
  it("is ready when the title, price, artist and category are all present", () => {
    const group = draft({ artist: { id: "artist-1", firstName: "Ada", lastName: "Lovelace" } });

    expect(importBlockers(group, categories)).toEqual([]);
    expect(isImportReady(group, categories)).toBe(true);
  });

  it("accepts an artist parsed from the title that the import can create", () => {
    expect(isImportReady(draft({ artistName: "Ada Lovelace", categoryPath: ["Mirrors"] }), categories)).toBe(true);
  });

  it("flags the fields the import button would refuse", () => {
    expect(importBlockers(draft({ title: "" }), categories)).toContain("title");
    expect(importBlockers(draft({ title: "one two three four five six seven eight nine ten eleven" }), categories))
      .toContain("titleLength");
    expect(importBlockers(draft({ price: "not a price" }), categories)).toContain("price");
    expect(importBlockers(draft({ categoryId: "", categoryPath: [] }), categories)).toContain("category");
    expect(importBlockers(draft({ categoryId: "", categoryPath: [], category: "Unknown" }), categories))
      .toContain("category");
    expect(hasDetailBlocker(importBlockers(draft({ price: "" }), categories))).toBe(true);
  });

  it("waits for an existing piece's differences to be confirmed", () => {
    const existing = {
      id: "existing-1", title: "Old title", description: "", price: 100,
      category: "Mirrors", imageUrls: [],
    } as unknown as ImportGroupDraft["existing"];
    const group = draft({ existing, title: "Carved mirror", artist: { id: "artist-1", firstName: "Ada", lastName: "Lovelace" } });

    expect(importBlockers(group, categories)).toContain("unconfirmed");
    expect(isImportReady({ ...group, confirmed: true }, categories)).toBe(true);
  });

  it("does not call a saved row ready", () => {
    const group = draft({ status: "saved", artist: { id: "artist-1", firstName: "Ada", lastName: "Lovelace" } });

    expect(isImportReady(group, categories)).toBe(false);
  });
});
