import { parseCsvSources, parseCsvText, parsePrice } from "./csv";

describe("reading the folder's CSV files", () => {
  it("reads a semicolon file with quoted fields, a newline in a description and a European price", () => {
    const text = "\uFEFFfile;title;description;price\r\n"
      + "\"Mirrors/Carved mirror\";\"Carved mirror\";\"Late 19th,\nwith inlay\";\"1.250,50\"\r\n";

    const { records, issues } = parseCsvSources([{ name: "pieces.csv", text }]);

    expect(issues).toEqual([]);
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({
      file: "Mirrors/Carved mirror",
      title: "Carved mirror",
      description: "Late 19th,\nwith inlay",
      price: 1250.5,
      source: "pieces.csv",
      line: 2,
    });
  });

  it("accepts an English export with comma delimiters and a thousands separator", () => {
    const text = "file,title,description,price\nLamps/Brass lamp,Brass lamp,Art deco,\"1,250.00\"\n";

    const { records } = parseCsvSources([{ name: "pieces.csv", text }]);

    expect(records[0]).toMatchObject({ file: "Lamps/Brass lamp", title: "Brass lamp", price: 1250 });
  });

  it("treats a `name` column of filenames as the file and falls back to the filename for the title", () => {
    const text = "name,description,price\nfront.jpg,The front,480\nback.jpg,The back,480\n";

    const { records } = parseCsvSources([{ name: "pieces.csv", text }]);

    expect(records.map((record) => record.file)).toEqual(["front.jpg", "back.jpg"]);
    expect(records.every((record) => record.title === undefined)).toBe(true);
  });

  it("treats a `name` column of titles as the title", () => {
    const text = "name,description,price\nCarved mirror,Late 19th,480\n";

    const { records } = parseCsvSources([{ name: "pieces.csv", text }]);

    expect(records[0]).toMatchObject({ title: "Carved mirror", file: undefined });
  });

  it("names an unreadable price and keeps the row so the admin can correct it", () => {
    const { records, issues } = parseCsvSources([{
      name: "pieces.csv",
      text: "file,title,description,price\nfront.jpg,Carved mirror,Late 19th,on request\n",
    }]);

    expect(records[0]).toMatchObject({ file: "front.jpg", title: "Carved mirror", price: undefined });
    expect(issues).toEqual([{ key: "csvInvalidPrice", source: "pieces.csv", line: 2, value: "on request" }]);
  });

  it("reports a CSV without a file or title column instead of guessing", () => {
    const { records, issues } = parseCsvSources([{ name: "notes.csv", text: "foo,bar\n1,2\n" }]);

    expect(records).toEqual([]);
    expect(issues).toEqual([{ key: "csvNoRecognisedColumns", source: "notes.csv" }]);
  });

  it("reads the category column in the languages the gallery edits in", () => {
    const semicolon = "file;titel;categorie;prijs\nfront.jpg;Spiegel;Mirrors / Wall mirrors;480\n";
    const comma = "fichier,titre,catégorie,prix\nback.jpg,Miroir,Mirrors,480\n";

    const { records } = parseCsvSources([
      { name: "pieces.csv", text: semicolon },
      { name: "pieces-fr.csv", text: comma },
    ]);

    expect(records[0]).toMatchObject({ title: "Spiegel", category: "Mirrors / Wall mirrors", price: 480 });
    expect(records[1]).toMatchObject({ title: "Miroir", category: "Mirrors", price: 480 });
  });

  it("skips the delimiter line Excel sometimes writes first", () => {
    const { records } = parseCsvSources([{
      name: "pieces.csv",
      text: "sep=;\nfile;title;description;price\nfront.jpg;Carved mirror;Late 19th;480\n",
    }]);

    expect(records[0]).toMatchObject({ file: "front.jpg", title: "Carved mirror", price: 480 });
  });

  it("ignores blank rows and skips a file with no data", () => {
    const { records, issues } = parseCsvSources([
      { name: "empty.csv", text: "file,title,description,price\n" },
      { name: "pieces.csv", text: "file,title,description,price\n\nfront.jpg,Carved mirror,,480\n" },
    ]);

    expect(issues).toEqual([]);
    expect(records).toHaveLength(1);
    expect(records[0].line).toBe(3);
  });
});

describe("CSV parsing details", () => {
  it("keeps escaped quotes and commas inside quoted fields", () => {
    const rows = parseCsvText('file,title\nfront.jpg,"A ""carved"", walnut mirror"\n');

    expect(rows[1]).toEqual(["front.jpg", 'A "carved", walnut mirror']);
  });

  it("reads the price formats a spreadsheet writes", () => {
    expect(parsePrice("€ 1.250,00")).toBe(1250);
    expect(parsePrice("1,250.00")).toBe(1250);
    expect(parsePrice("1250,50")).toBe(1250.5);
    expect(parsePrice("1250.50")).toBe(1250.5);
    expect(parsePrice("1,250")).toBe(1250);
    expect(parsePrice("1.250")).toBe(1250);
    expect(parsePrice("12,5")).toBe(12.5);
    expect(parsePrice("750")).toBe(750);
    expect(parsePrice("on request")).toBeUndefined();
  });
});
