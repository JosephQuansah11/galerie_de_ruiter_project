import { filePath, type ImportCategorySource, type ImportIssue } from "./buildImportGroups";
import type { CsvGrouping, CsvRecord } from "./csv";
import type { ImportGroupDraft } from "./useFolderImport";

/**
 * The import preview is kept in IndexedDB so leaving the screen - or reloading the page - does not
 * throw away a folder the curator has already checked. Files are stored as File/Blob values, which
 * IndexedDB supports; their browser-only `webkitRelativePath` is stored beside them and put back on
 * restore.
 */
export type StoredFile = { path: string; file: File };
export type StoredImportGroup = Omit<ImportGroupDraft, "previewUrl">;
export type ImportSessionInput = {
  folderFiles: StoredFile[];
  extraCsvFiles: StoredFile[];
  groups: StoredImportGroup[];
  records: CsvRecord[];
  parseIssues: ImportIssue[];
  issues: ImportIssue[];
  grouping: CsvGrouping;
  categorySource: ImportCategorySource;
  folderName: string;
  imageCount: number;
  csvCount: number;
};
export type SavedImportSession = ImportSessionInput & {
  version: number;
  savedAt: number;
};

export const IMPORT_SESSION_VERSION = 1;
const DB_NAME = "galerie-de-ruiter-import";
const DB_VERSION = 1;
const STORE = "sessions";
const KEY = "current";

function supported(): boolean {
  return typeof indexedDB !== "undefined";
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE)) database.createObjectStore(STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB could not be opened."));
    request.onblocked = () => reject(new Error("IndexedDB is blocked by another tab."));
  });
}

/** Stores the current preview; false means the browser could not keep it. */
export async function saveImportSession(session: ImportSessionInput): Promise<boolean> {
  if (!supported()) return false;
  try {
    const database = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STORE, "readwrite");
      transaction.objectStore(STORE).put({
        ...session,
        version: IMPORT_SESSION_VERSION,
        savedAt: Date.now(),
      }, KEY);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
    database.close();
    return true;
  } catch {
    return false;
  }
}

/** The last saved preview, or nothing when there is none (or the browser cannot read it). */
export async function loadImportSession(): Promise<SavedImportSession | undefined> {
  if (!supported()) return undefined;
  try {
    const database = await openDatabase();
    const saved = await new Promise<SavedImportSession | undefined>((resolve, reject) => {
      const transaction = database.transaction(STORE, "readonly");
      const request = transaction.objectStore(STORE).get(KEY);
      request.onsuccess = () => resolve(request.result as SavedImportSession | undefined);
      request.onerror = () => reject(request.error);
    });
    database.close();
    return saved?.version === IMPORT_SESSION_VERSION ? saved : undefined;
  } catch {
    return undefined;
  }
}

/** Removes the saved preview, for example when the curator clears the folder. */
export async function clearImportSession(): Promise<void> {
  if (!supported()) return;
  try {
    const database = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STORE, "readwrite");
      transaction.objectStore(STORE).delete(KEY);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
    database.close();
  } catch {
    // A browser that cannot open IndexedDB simply keeps the session in memory for this visit.
  }
}

/** Puts the browser-only folder path back on a File restored from IndexedDB. */
export function restoreFilePath(file: File, path: string): File {
  if (!path) return file;
  if ((file as File & { webkitRelativePath?: string }).webkitRelativePath === path) return file;
  try {
    Object.defineProperty(file, "webkitRelativePath", { value: path, configurable: true });
    return file;
  } catch {
    const copy = new File([file], file.name, { type: file.type, lastModified: file.lastModified });
    Object.defineProperty(copy, "webkitRelativePath", { value: path, configurable: true });
    return copy;
  }
}

/** The compact form of a File the session stores: the path plus the bytes. */
export function storedFile(file: File): StoredFile {
  return { path: filePath(file), file };
}

/** A group without its object URL, which cannot be restored and is rebuilt from its files. */
export function storedGroup(group: ImportGroupDraft): StoredImportGroup {
  const copy: Partial<ImportGroupDraft> = { ...group };
  delete copy.previewUrl;
  return copy as StoredImportGroup;
}
