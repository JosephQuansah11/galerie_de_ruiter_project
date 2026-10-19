/**
 * Turns the files from a picked folder into the pieces the import screen shows.
 *
 * A folder is the natural unit: `Root/Mirrors/Carved mirror/front.jpg` is one piece with its
 * photographs, and the nested path is kept so a CSV can name either the folder or an image. Images
 * that sit directly in the picked root are pieces of their own, because there is no folder name to
 * group them under. Admins who store one piece per photograph can switch to image mode.
 */

import type { CsvGrouping, CsvRecord } from "./csv";

export type ImportIssue = { key: string; params?: Record<string, string | number> };

export type ImportImage = { file: File; path: string; name: string };

export type ImportGroup = {
  id: string;
  /** The folder path, or the image path in image mode. */
  label: string;
  /** The last folder segment, or the image's name without its extension. */
  folderName: string;
  images: ImportImage[];
  title: string;
  description: string;
  price: string;
  record?: CsvRecord;
};

export type ImportBuild = {
  groups: ImportGroup[];
  imageCount: number;
  csvCount: number;
  unsupportedCount: number;
  issues: ImportIssue[];
};

const IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "gif", "avif", "heic", "heif", "bmp", "tif", "tiff", "jfif"]);
const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });

/** A file the browser exposed through the folder picker, including its nested path. */
export function filePath(file: File): string {
  const relative = (file as File & { webkitRelativePath?: string }).webkitRelativePath;
  return (relative || file.name).replace(/\\/g, "/").replace(/^\.?\//, "").replace(/\/+/g, "/");
}

export function isCsvFile(file: File): boolean {
  return /\.csv$/i.test(file.name);
}

/** Finder and Windows metadata that a folder picker happily includes with the photographs. */
export function isIgnoredFile(file: File): boolean {
  const path = filePath(file);
  return path.split("/").some((segment) => segment === "__MACOSX" || segment.startsWith("._"))
    || file.name === ".DS_Store" || file.name === "Thumbs.db";
}

function extension(file: File): string {
  return file.name.split(".").pop()?.toLowerCase() ?? "";
}

function isSupportedImage(file: File): boolean {
  return file.type.startsWith("image/") || IMAGE_EXTENSIONS.has(extension(file));
}

/** A spreadsheet's `Carved_mirror` or `carved-mirror` reads as a title. */
export function humaniseName(name: string): string {
  const base = name.split("/").filter(Boolean).pop() ?? name;
  return base.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
}

function normalisePath(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\.?\//, "")
    .replace(/\/+/g, "/")
    .replace(/\/$/, "")
    .toLowerCase();
}

function slug(value: string): string {
  return normalisePath(value).replace(/\.[a-z0-9]+$/i, "").replace(/[^a-z0-9]+/g, " ").trim();
}

/** A path and every suffix of it, so a CSV written from the item folder still matches. */
function pathKeys(value: string): string[] {
  const path = normalisePath(value);
  if (!path) return [];
  const parts = path.split("/");
  const keys = new Set<string>([path]);
  for (let index = 1; index < parts.length; index += 1) keys.add(parts.slice(index).join("/"));
  const base = parts[parts.length - 1];
  keys.add(base);
  keys.add(base.replace(/\.[^.]+$/, ""));
  keys.add(slug(base));
  return [...keys].filter(Boolean);
}

function recordId(record: CsvRecord): string {
  return `${record.source}\u0000${record.line}`;
}

function folderWithinRoot(path: string): string {
  const parts = path.split("/");
  return parts.length > 2 ? parts.slice(1, -1).join("/") : "";
}

/** The highest folder in the branch that holds photographs directly. */
function owningFolder(folder: string, directFolders: Set<string>): string {
  const parts = folder.split("/");
  for (let index = 1; index <= parts.length; index += 1) {
    const candidate = parts.slice(0, index).join("/");
    if (directFolders.has(candidate)) return candidate;
  }
  return folder;
}

function createGroups(images: ImportImage[], grouping: CsvGrouping): ImportGroup[] {
  const groups = new Map<string, ImportGroup>();
  const directFolders = new Set(images.map((image) => folderWithinRoot(image.path)).filter(Boolean));
  for (const image of images) {
    const parts = image.path.split("/");
    // The browser prefixes the picked root folder. A file directly in it has no folder of its own,
    // so it becomes a piece rather than merging every loose photograph into one "root" piece.
    const relativeFolder = folderWithinRoot(image.path);
    // `Item/details/close.jpg` stays with `Item` when `Item` also holds photographs directly.
    const itemFolder = owningFolder(relativeFolder, directFolders);
    const perImage = grouping === "image" || !itemFolder;
    const key = perImage ? `image:${image.path}` : `folder:${itemFolder}`;
    const label = perImage || !itemFolder ? image.path : `${parts[0]}/${itemFolder}`;
    let group = groups.get(key);
    if (!group) {
      const leaf = perImage ? humaniseName(image.name) : humaniseName(itemFolder);
      group = {
        id: key,
        label,
        folderName: leaf,
        images: [],
        title: leaf,
        description: "",
        price: "",
      };
      groups.set(key, group);
    }
    group.images.push(image);
  }

  const result = [...groups.values()];
  for (const group of result) {
    group.images.sort((left, right) => {
      const depth = left.path.split("/").length - right.path.split("/").length;
      return depth || collator.compare(left.path, right.path);
    });
  }
  return result.sort((left, right) => collator.compare(left.label, right.label));
}

type RecordIndex = Map<string, CsvRecord[]>;

function addToIndex(index: RecordIndex, key: string, record: CsvRecord): void {
  if (!key) return;
  const records = index.get(key) ?? [];
  if (!records.some((candidate) => recordId(candidate) === recordId(record))) records.push(record);
  index.set(key, records);
}

function uniqueRecords(records: CsvRecord[]): CsvRecord[] {
  return [...new Map(records.map((record) => [recordId(record), record])).values()];
}

/** Builds the two lookup tables: by file/folder name, and by title. */
function indexRecords(records: CsvRecord[]): { byPath: RecordIndex; byTitle: RecordIndex } {
  const byPath: RecordIndex = new Map();
  const byTitle: RecordIndex = new Map();
  for (const record of records) {
    if (record.file) {
      for (const key of pathKeys(record.file)) addToIndex(byPath, key, record);
    }
    if (record.title) {
      // A title is often the only name a hand-made CSV has, so it may name the folder or image too.
      for (const key of pathKeys(record.title)) addToIndex(byPath, key, record);
      addToIndex(byTitle, normalisePath(record.title), record);
      addToIndex(byTitle, slug(record.title), record);
    }
  }
  return { byPath, byTitle };
}

function groupKeys(group: ImportGroup): string[] {
  const keys = new Set<string>();
  for (const image of group.images) {
    for (const key of pathKeys(image.path)) keys.add(key);
    keys.add(slug(image.name));
  }
  for (const key of pathKeys(group.label)) keys.add(key);
  keys.add(normalisePath(group.folderName));
  keys.add(slug(group.folderName));
  keys.add(slug(group.title));
  return [...keys].filter(Boolean);
}

/** Builds the import preview. Nothing here touches the network or creates object URLs. */
export function buildImportGroups(files: File[], records: CsvRecord[], grouping: CsvGrouping): ImportBuild {
  const considered = files.filter((file) => !isIgnoredFile(file));
  const csvCount = considered.filter(isCsvFile).length;
  const imageFiles = considered.filter(isSupportedImage);
  const unsupportedCount = considered.length - csvCount - imageFiles.length;
  const issues: ImportIssue[] = [];
  if (unsupportedCount > 0) {
    issues.push({ key: "importUnsupportedFiles", params: { count: unsupportedCount } });
  }

  const images = imageFiles.map((file) => ({ file, path: filePath(file), name: file.name }));
  const groups = createGroups(images, grouping);
  const { byPath, byTitle } = indexRecords(records);

  // A basename is only safe when it names one group. The same `front.jpg` in two item folders must
  // be addressed by its folder path in the CSV, or neither piece is guessed at.
  const owners = new Map<string, Set<string>>();
  for (const group of groups) {
    for (const key of groupKeys(group)) {
      const ids = owners.get(key) ?? new Set<string>();
      ids.add(group.id);
      owners.set(key, ids);
    }
  }

  const used = new Set<string>();
  const ambiguous = new Set<string>();

  function lookup(index: RecordIndex, key: string): CsvRecord | undefined {
    const candidates = uniqueRecords(index.get(key) ?? []);
    if (candidates.length === 0) return undefined;
    if (candidates.length > 1 || (owners.get(key)?.size ?? 0) > 1) {
      ambiguous.add(key);
      return undefined;
    }
    used.add(recordId(candidates[0]));
    return candidates[0];
  }

  for (const group of groups) {
    const keys = groupKeys(group);
    let record: CsvRecord | undefined;
    for (const key of keys) {
      record = lookup(byPath, key);
      if (record) break;
    }
    if (!record) {
      for (const key of keys) {
        record = lookup(byTitle, key);
        if (record) break;
      }
    }
    // One row and one piece is unambiguous even when neither repeats the other's name - but only
    // when the row did not name a file: a row naming a missing image is a warning, not a guess.
    if (!record && groups.length === 1 && records.length === 1 && !records[0].file) {
      record = records[0];
      used.add(recordId(record));
    }
    if (!record) continue;

    group.record = record;
    group.title = record.title?.trim() || group.title;
    group.description = record.description ?? "";
    group.price = record.price === undefined ? "" : String(record.price);
  }

  for (const key of ambiguous) {
    issues.push({ key: "csvAmbiguousMatch", params: { value: key } });
  }
  for (const record of records) {
    if (used.has(recordId(record))) continue;
    issues.push({
      key: "csvRowUnmatched",
      params: { source: record.source, line: record.line, value: record.file ?? record.title ?? record.priceText ?? "" },
    });
  }

  return { groups, imageCount: images.length, csvCount, unsupportedCount, issues };
}

