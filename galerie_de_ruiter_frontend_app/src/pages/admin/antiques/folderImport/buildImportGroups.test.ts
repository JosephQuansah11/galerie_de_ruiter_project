import { buildImportGroups } from "./buildImportGroups";
import type { CsvRecord } from "./csv";

function image(path: string): File {
  const name = path.split("/").pop() ?? path;
  const file = new File([new Uint8Array(1)], name, { type: "image/jpeg" });
  Object.defineProperty(file, "webkitRelativePath", { value: path });
  return file;
}

function csv(path: string): File {
  const file = new File(["file,title,description,price\n"], path.split("/").pop() ?? "pieces.csv", { type: "text/csv" });
  Object.defineProperty(file, "webkitRelativePath", { value: path });
  return file;
}

function record(partial: Partial<CsvRecord> & { line: number }): CsvRecord {
  return { source: "pieces.csv", ...partial };
}

describe("grouping a picked folder", () => {
  const files = [
    image("Root/Mirrors/Carved mirror/front.jpg"),
    image("Root/Mirrors/Carved mirror/back.jpg"),
    image("Root/Lamps/Brass lamp/1.jpg"),
    csv("Root/pieces.csv"),
    new File(["notes"], "notes.txt", { type: "text/plain" }),
  ];
  const records = [
    record({ file: "Mirrors/Carved mirror", title: "Carved mirror", description: "Late 19th", price: 480.5, category: "Mirrors", line: 2 }),
    record({ file: "Lamps/Brass lamp/1.jpg", title: "Brass lamp", description: "Art deco", price: 1250, category: "Lighting", line: 3 }),
  ];

  it("keeps every photograph in a folder together and uses the folder name when the CSV has no title", () => {
    const build = buildImportGroups(files, records, "folder");

    expect(build.imageCount).toBe(3);
    expect(build.csvCount).toBe(1);
    expect(build.unsupportedCount).toBe(1);
    expect(build.groups).toHaveLength(2);

    const carved = build.groups.find((group) => group.folderName === "Carved mirror");
    expect(carved).toMatchObject({ title: "Carved mirror", description: "Late 19th", price: "480.5", category: "Mirrors" });
    expect(carved?.images.map((entry) => entry.path)).toEqual([
      "Root/Mirrors/Carved mirror/back.jpg",
      "Root/Mirrors/Carved mirror/front.jpg",
    ]);
    expect(carved?.record?.line).toBe(2);

    const brass = build.groups.find((group) => group.folderName === "Brass lamp");
    expect(brass).toMatchObject({ title: "Brass lamp", price: "1250", category: "Lighting" });
    expect(brass?.images).toHaveLength(1);
    expect(build.issues).toContainEqual({ key: "importUnsupportedFiles", params: { count: 1 } });
  });

  it("creates one piece per photograph in image mode", () => {
    const perImage = [
      record({ file: "Mirrors/Carved mirror/front.jpg", title: "Carved mirror front", price: 480, line: 2 }),
      record({ file: "Mirrors/Carved mirror/back.jpg", title: "Carved mirror back", price: 480, line: 3 }),
      record({ file: "Lamps/Brass lamp/1.jpg", title: "Brass lamp", price: 1250, line: 4 }),
    ];

    const build = buildImportGroups(files, perImage, "image");

    expect(build.groups).toHaveLength(3);
    expect(build.groups.every((group) => group.images.length === 1)).toBe(true);
    expect(build.groups.map((group) => group.title)).toEqual(["Brass lamp", "Carved mirror back", "Carved mirror front"]);
  });

  it("matches a CSV row to a folder by its title when there is no file column", () => {
    const build = buildImportGroups(
      [image("Root/Mirrors/Carved_mirror/front.jpg")],
      [record({ title: "Carved mirror", price: 480, line: 2 })],
      "folder",
    );

    expect(build.groups[0]).toMatchObject({ title: "Carved mirror", price: "480" });
    expect(build.groups[0].record).toBeDefined();
  });

  it("does not guess when the same filename appears in two folders", () => {
    const build = buildImportGroups(
      [image("Root/A/front.jpg"), image("Root/B/front.jpg")],
      [record({ file: "front.jpg", title: "Front", price: 100, line: 2 })],
      "folder",
    );

    expect(build.groups.every((group) => group.record === undefined)).toBe(true);
    expect(build.issues.some((issue) => issue.key === "csvAmbiguousMatch")).toBe(true);
    expect(build.issues.filter((issue) => issue.key === "csvRowUnmatched")).toHaveLength(1);
  });

  it("keeps a details subfolder with the item that holds photographs directly", () => {
    const build = buildImportGroups([
      image("Root/Item/front.jpg"),
      image("Root/Item/details/close.jpg"),
    ], [], "folder");

    expect(build.groups).toHaveLength(1);
    expect(build.groups[0].folderName).toBe("Item");
    expect(build.groups[0].images.map((entry) => entry.path)).toEqual([
      "Root/Item/front.jpg",
      "Root/Item/details/close.jpg",
    ]);
  });

  it("treats loose images in the selected root as separate pieces", () => {
    const build = buildImportGroups([image("Root/a.jpg"), image("Root/b.jpg")], [], "folder");

    expect(build.groups).toHaveLength(2);
    expect(build.groups.map((group) => group.title)).toEqual(["a", "b"]);
    expect(build.issues).toEqual([]);
  });

  it("merges folders that carry the same title into one piece", () => {
    const build = buildImportGroups([
      image("Root/Mirrors/Carved mirror/front.jpg"),
      image("Root/Lamps/Carved mirror/back.jpg"),
    ], [], "folder");

    expect(build.groups).toHaveLength(1);
    expect(build.groups[0].title).toBe("Carved mirror");
    expect(build.groups[0].images).toHaveLength(2);
    // The folders disagree on the category, so the piece is flagged for the curator to check.
    expect(build.issues).toContainEqual({ key: "importSharedTitleConflict", params: { title: "Carved mirror" } });
  });

  it("keeps the first details and flags a shared title with conflicting details", () => {
    const build = buildImportGroups([
      image("Root/Mirrors/Carved mirror/front.jpg"),
      image("Root/Lamps/Carved mirror/back.jpg"),
    ], [
      record({ file: "Mirrors/Carved mirror", title: "Carved mirror", description: "Late 19th", price: 480, line: 2 }),
      record({ file: "Lamps/Carved mirror", title: "Carved mirror", description: "Art deco", price: 900, line: 3 }),
    ], "folder");

    expect(build.groups).toHaveLength(1);
    // Groups are ordered by their folder label, so Lamps is the first one here.
    expect(build.groups[0].description).toBe("Art deco");
    expect(build.groups[0].price).toBe("900");
    expect(build.issues).toContainEqual({ key: "importSharedTitleConflict", params: { title: "Carved mirror" } });
  });

  it("does not call a CSV row unmatched before any images are selected", () => {
    const build = buildImportGroups(
      [csv("Root/pieces.csv")],
      [record({ file: "Mirrors/Carved mirror", title: "Carved mirror", price: 480, line: 2 })],
      "folder",
    );

    expect(build.groups).toEqual([]);
    expect(build.issues.some((issue) => issue.key === "csvRowUnmatched")).toBe(false);
  });

  it("names a CSV row that matched no image", () => {
    const build = buildImportGroups(
      [image("Root/A/front.jpg")],
      [record({ file: "Elsewhere/side.jpg", title: "Side", line: 7 })],
      "folder",
    );

    expect(build.issues).toContainEqual({
      key: "csvRowUnmatched",
      params: { source: "pieces.csv", line: 7, value: "Elsewhere/side.jpg" },
    });
  });
});

describe("reading categories from the folder hierarchy", () => {
  it("uses the folders above the piece as its category path", () => {
    const build = buildImportGroups([
      image("Root/Boeken/Antiek/Stoel/front.jpg"),
      image("Root/Boeken/Antiek/Stoel/back.jpg"),
    ], [], "folder");

    expect(build.groups).toHaveLength(1);
    expect(build.groups[0].categoryPath).toEqual(["Boeken", "Antiek"]);
  });

  it("can start at the picked folder when that folder is the main category", () => {
    const build = buildImportGroups(
      [image("Boeken/Antiek/Stoel/front.jpg")], [], "folder", "chosen");

    expect(build.groups[0].categoryPath).toEqual(["Boeken", "Antiek"]);
  });

  it("treats every folder as a category when each photograph is a piece", () => {
    const build = buildImportGroups(
      [image("Root/Boeken/Antiek/front.jpg")], [], "image");

    expect(build.groups[0].categoryPath).toEqual(["Boeken", "Antiek"]);
  });

  it("keeps a single folder as a main category", () => {
    const build = buildImportGroups([image("Root/Boeken/Stoel/front.jpg")], [], "folder");

    expect(build.groups[0].categoryPath).toEqual(["Boeken"]);
  });

  it("flags folders deeper than the gallery's two category levels", () => {
    const build = buildImportGroups([image("Root/A/B/C/Item/front.jpg")], [], "folder");

    expect(build.groups[0].categoryPath).toEqual(["A", "B", "C"]);
    expect(build.issues).toContainEqual({ key: "importCategoryTooDeep", params: { path: "A / B / C" } });
  });
});
