/**
 * Reads the CSV files an admin includes in an image folder.
 *
 * The gallery prepares these files in a spreadsheet, so the parser has to cope with what a
 * spreadsheet actually writes: comma or semicolon delimiters, quoted fields with newlines, a UTF-8
 * BOM, Windows line endings and prices written as `1.250,00` or `1,250.00`. The column names are
 * matched by meaning rather than by position, in the four languages the gallery edits in.
 */

export type CsvRecord = {
  /** The image file or folder this row describes, when the CSV names one. */
  file?: string;
  title?: string;
  description?: string;
  price?: number;
  /** The category as the spreadsheet names it; matched to a category record on the import screen. */
  category?: string;
  /** The raw price, kept so an unreadable value can be named in the warning. */
  priceText?: string;
  source: string;
  line: number;
};

export type CsvIssue = {
  key: "csvNoRecognisedColumns" | "csvInvalidPrice";
  source: string;
  line?: number;
  value?: string;
};

export type CsvParseResult = { records: CsvRecord[]; issues: CsvIssue[] };
export type CsvSource = { name: string; text: string };
export type CsvGrouping = "folder" | "image";

type Column = "file" | "title" | "description" | "price" | "category";

const COLUMN_HEADERS: Record<Column, string[]> = {
  file: ["file", "filename", "filepath", "path", "image", "imagename", "imagepath", "imagefile", "photo", "photoname",
    "picture", "bestand", "bestandsnaam", "bestandspad", "afbeelding", "afbeeldingsnaam", "foto", "datei", "dateiname",
    "dateipfad", "bild", "fichier", "nomdufichier", "chemin", "imagen"],
  title: ["title", "titel", "titre", "object", "objectname", "item", "piece", "antique", "antiek",
    "benaming", "bezeichnung", "onderwerp"],
  description: ["description", "desc", "beschrijving", "omschrijving", "beschreibung", "details", "detail",
    "notes", "note", "story", "verhaal", "verhaaltje"],
  price: ["price", "prijs", "preis", "prix", "amount", "bedrag", "betrag", "montant", "value", "waarde",
    "wert", "euro", "eur", "priceeur", "prijseur", "prixeur", "preiseur"],
  category: ["category", "categories", "collection", "subcategory", "subcategoryname", "subcollection",
    "categorie", "categorieen", "collectie", "subcategorie", "subcategorienaam",
    "kategorie", "kategorien", "sammlung", "unterkategorie", "unterkategoriename",
    "rubrique", "souscategorie", "souscategories"],
};

/** `name` is title in one spreadsheet and filename in the next; the values decide. */
const AMBIGUOUS_HEADERS = new Set(["name", "naam", "nom"]);
const IMAGE_NAME = /\.(jpe?g|png|webp|gif|avif|heic|heif|bmp|tiff?|jfif)$/i;

function normaliseHeader(value: string): string {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "");
}

function headerColumn(value: string): Column | "name" | undefined {
  const key = normaliseHeader(value);
  if (AMBIGUOUS_HEADERS.has(key)) return "name";
  return (Object.keys(COLUMN_HEADERS) as Column[]).find((column) => COLUMN_HEADERS[column].includes(key));
}

function looksLikeFile(value: string): boolean {
  const trimmed = value.trim();
  return IMAGE_NAME.test(trimmed) || trimmed.includes("/") || trimmed.includes("\\");
}

/** Counts the delimiters outside quoted fields on one line. */
function countDelimiters(line: string, delimiter: string): number {
  let quoted = false;
  let count = 0;
  for (let index = 0; index < line.length; index += 1) {
    if (line[index] === '"') quoted = !quoted;
    else if (!quoted && line[index] === delimiter) count += 1;
  }
  return count;
}

/** Picks the separator the header row uses. Spreadsheets in Belgium write `;`. */
export function detectDelimiter(text: string): string {
  const line = text.replace(/^\uFEFF/, "").split(/\r?\n/).find((candidate) => candidate.trim()) ?? "";
  const candidates = [",", ";", "\t"].map((delimiter) => ({ delimiter, count: countDelimiters(line, delimiter) }));
  const best = candidates.reduce((current, candidate) => candidate.count > current.count ? candidate : current);
  return best.count > 0 ? best.delimiter : ",";
}

/** Parses delimited text, including quoted fields, escaped quotes and newlines inside quotes. */
export function parseCsvText(text: string, delimiter = detectDelimiter(text)): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  const input = text.replace(/^\uFEFF/, "");

  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];
    if (quoted) {
      if (character === '"') {
        if (input[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          quoted = false;
        }
      } else {
        field += character;
      }
    } else if (character === '"') {
      quoted = true;
    } else if (character === delimiter) {
      row.push(field);
      field = "";
    } else if (character === "\n" || character === "\r") {
      if (character === "\r" && input[index + 1] === "\n") index += 1;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += character;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

/**
 * Reads a price from a spreadsheet cell. A comma is decimal in Belgium and a thousands separator
 * in an English export; the last separator with two digits after it is treated as the decimal one.
 */
export function parsePrice(raw: string): number | undefined {
  let value = raw.trim().replace(/[^\d.,-]/g, "");
  if (!value) return undefined;
  const negative = value.startsWith("-");
  value = value.replace(/-/g, "");
  const comma = value.lastIndexOf(",");
  const dot = value.lastIndexOf(".");

  if (comma >= 0 && dot >= 0) {
    value = comma > dot
      ? value.replace(/\./g, "").replace(",", ".")
      : value.replace(/,/g, "");
  } else if (comma >= 0) {
    const decimals = value.length - comma - 1;
    value = decimals <= 2
      ? `${value.slice(0, comma).replace(/,/g, "")}.${value.slice(comma + 1)}`
      : value.replace(/,/g, "");
  } else if (dot >= 0) {
    const decimals = value.length - dot - 1;
    const singleDot = value.indexOf(".") === dot;
    // `1.250` is a thousands grouping in a European export, not one and a quarter.
    if (decimals === 3 && singleDot) value = value.replace(/\./g, "");
  }

  const amount = Number(value);
  if (!Number.isFinite(amount)) return undefined;
  return negative ? -amount : amount;
}

function mapColumns(header: string[], dataRows: string[][]): Partial<Record<Column, number>> {
  const columns: Partial<Record<Column, number>> = {};
  const ambiguous: number[] = [];
  header.forEach((cell, index) => {
    const column = headerColumn(cell);
    if (column === "name") ambiguous.push(index);
    else if (column && columns[column] === undefined) columns[column] = index;
  });

  const data = dataRows.filter((row) => row.some((cell) => cell.trim()));
  const ambiguousIsFile = ambiguous.length > 0 && data.length > 0
    && data.every((row) => ambiguous.some((index) => looksLikeFile(row[index] ?? "")));
  if (columns.file === undefined && ambiguousIsFile) columns.file = ambiguous[0];
  else if (columns.title === undefined && ambiguous.length > 0) columns.title = ambiguous[0];
  return columns;
}

/** Parses every CSV in the picked folder. One bad row does not stop the others. */
export function parseCsvSources(sources: CsvSource[]): CsvParseResult {
  const records: CsvRecord[] = [];
  const issues: CsvIssue[] = [];

  for (const source of sources) {
    const rows = parseCsvText(source.text)
      .map((cells, index) => ({ cells, line: index + 1 }))
      .filter((row) => row.cells.some((cell) => cell.trim()));
    // Excel can write `sep=;` as the first line to declare the delimiter.
    if (/^sep=$/i.test(rows[0]?.cells[0]?.trim() ?? "")) rows.shift();
    if (rows.length < 2) continue;

    const header = rows[0].cells;
    const data = rows.slice(1);
    const columns = mapColumns(header, data.map((row) => row.cells));
    if (columns.file === undefined && columns.title === undefined) {
      issues.push({ key: "csvNoRecognisedColumns", source: source.name });
      continue;
    }

    for (const row of data) {
      const cell = (index?: number) => index === undefined ? "" : (row.cells[index] ?? "").trim();
      const file = cell(columns.file);
      const title = cell(columns.title);
      const description = cell(columns.description);
      const priceText = cell(columns.price);
      const category = cell(columns.category);
      if (!file && !title && !description && !priceText && !category) continue;

      const price = priceText ? parsePrice(priceText) : undefined;
      if (priceText && price === undefined) {
        issues.push({ key: "csvInvalidPrice", source: source.name, line: row.line, value: priceText });
      }
      records.push({
        file: file || undefined,
        title: title || undefined,
        description: description || undefined,
        price,
        category: category || undefined,
        priceText: priceText || undefined,
        source: source.name,
        line: row.line,
      });
    }
  }
  return { records, issues };
}
