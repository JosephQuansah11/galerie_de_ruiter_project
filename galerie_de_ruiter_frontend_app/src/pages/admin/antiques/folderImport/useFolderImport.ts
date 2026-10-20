import { useCallback, useEffect, useRef, useState } from "react";
import { addAntique, createCategory, createDesigner, getAllAntiques, getAllCategories, getAllDesigners, getVisibleCategories, updateAntique, uploadAntiqueImage } from "@/apis/backend_api";
import type Antique from "@/models/antiques/Antique";
import type { Category, Designer } from "@/models/antiques/Antique";
import { publishContentUpdate } from "@/services/contentUpdates";
import { saveErrorKey } from "@/pages/antiques/antiqueSaveErrors";
import { categoryIdFor, categoryNameKey, flattenAllCategories, matchCategory, matchCategoryPath } from "./categoryMatching";
import { existingIndex, matchExisting, titleKey } from "./existingMatching";
import { importDifferences, type ImportField } from "./differences";
import {
  artistNameParts,
  designerForName,
  designerIndex,
  designerKeys,
} from "./artistMatching";
import {
  buildImportGroups,
  filePath,
  isCsvFile,
  isIgnoredFile,
  type ImportBuild,
  type ImportCategorySource,
  type ImportGroup,
  type ImportIssue,
} from "./buildImportGroups";
import { parseCsvSources, type CsvGrouping, type CsvRecord, type CsvSource } from "./csv";
import {
  clearImportSession,
  loadImportSession,
  restoreFilePath,
  saveImportSession,
  storedFile,
  storedGroup,
  type ImportSessionInput,
} from "./importSession";

export type ImportStatus = "pending" | "saving" | "saved" | "failed";

/** The differing fields the admin chose to take from the folder or its CSV. */
export type ImportOverrides = Partial<Record<ImportField, boolean>>;

export type ImportGroupDraft = ImportGroup & {
  selected: boolean;
  artist?: Designer;
  /** The category the piece is created under; empty until the admin assigns one. */
  categoryId: string;
  status: ImportStatus;
  /** The piece this row created or updated; kept so a retry does not save it twice. */
  createdId?: string;
  uploadedCount: number;
  error?: string;
  previewUrl: string;
  /** An existing piece with the same title, if there is exactly one. */
  existing?: Antique;
  /** More than one existing piece has this title, so the import will not guess. */
  existingAmbiguous?: boolean;
  /**
   * Which differences the admin allowed to overwrite the gallery's values. A field that is not
   * ticked keeps what the existing piece says; a new piece ignores this.
   */
  overrides: ImportOverrides;
  /** True once the admin has seen this piece's differences and accepted them. */
  confirmed: boolean;
  /** Whether the folder's photographs are added to an existing piece. */
  addImages: boolean;
};

export type ImportProgress = { current: number; total: number; title: string };
export type ImportResult = { imported: number; failed: number; updated: number };

/** The existing piece's artist in the shape the import's artist picker and API use. */
function artistFromExisting(antique?: Antique): Designer | undefined {
  const artist = antique?.artist;
  if (!artist?.id) return undefined;
  return {
    id: artist.id,
    firstName: artist.firstName ?? artist.name ?? artist.displayName ?? "",
    lastName: artist.lastName ?? "",
    middleName: artist.middleName ?? undefined,
  };
}

function readWithFileReader(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(reader.error ?? new Error("The CSV could not be read."));
    reader.readAsText(file);
  });
}

async function readCsvText(file: File): Promise<string> {
  if (typeof file.arrayBuffer !== "function") return readWithFileReader(file);
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  // Excel on Windows can still write UTF-16 with a byte-order mark.
  if (bytes[0] === 0xFF && bytes[1] === 0xFE) return new TextDecoder("utf-16le").decode(buffer);
  if (bytes[0] === 0xFE && bytes[1] === 0xFF) return new TextDecoder("utf-16be").decode(buffer);
  const utf8 = new TextDecoder("utf-8").decode(buffer);
  // Excel writes Windows-1252 when the file is not explicitly saved as UTF-8.
  return utf8.includes("\uFFFD") ? new TextDecoder("windows-1252").decode(buffer) : utf8;
}

function imageErrorKey(error: unknown): string {
  const key = saveErrorKey(error);
  if (key === "antiqueSavePermissionError") return key;
  if (key === "antiqueSaveConnectionError") return "antiqueImageConnectionError";
  return "antiqueImageUploadFailed";
}

/**
 * The categories an import can reuse, keyed by name under their parent.
 *
 * <p>A run can name the same missing main category for many pieces, so the first one creates it and
 * the rest find it here. The tree the picker already has is enough; the full list is only fetched
 * when a creation collides with a hidden category or a parallel import.</p>
 */
function buildCategoryCache(categories: Category[]): Map<string, Category> {
  const cache = new Map<string, Category>();
  for (const category of categories) {
    cache.set(categoryNameKey(category.name, category.parentId), category);
    for (const child of category.children ?? []) cache.set(categoryNameKey(child.name, category.id), child);
  }
  return cache;
}

/** The same file chosen through the folder and through the CSV picker is read once. */
function fileIdentity(file: File): string {
  return `${filePath(file)}\u0000${file.size}\u0000${file.lastModified}`;
}

function mergeFileSets(...sets: File[][]): File[] {
  const files = new Map<string, File>();
  for (const file of sets.flat()) {
    if (!files.has(fileIdentity(file))) files.set(fileIdentity(file), file);
  }
  return [...files.values()];
}

/**
 * Reads a folder in the browser, matches its CSVs to the images and creates the pieces one by one.
 * Nothing is uploaded until `importSelected` is called, so the admin can correct titles, prices and
 * the artist for the whole batch first.
 */
export function useFolderImport() {
  const [groups, setGroups] = useState<ImportGroupDraft[]>([]);
  const [folderFiles, setFolderFiles] = useState<File[]>([]);
  const [extraCsvFiles, setExtraCsvFiles] = useState<File[]>([]);
  const [records, setRecords] = useState<CsvRecord[]>([]);
  const [parseIssues, setParseIssues] = useState<ImportIssue[]>([]);
  const [issues, setIssues] = useState<ImportIssue[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesError, setCategoriesError] = useState<string>();
  const [designers, setDesigners] = useState<Designer[]>([]);
  const [existingAntiques, setExistingAntiques] = useState<Antique[]>([]);
  const [existingLoading, setExistingLoading] = useState(true);
  const [existingError, setExistingError] = useState<string>();
  const [grouping, setGroupingState] = useState<CsvGrouping>("folder");
  const [categorySource, setCategorySource] = useState<ImportCategorySource>("auto");
  const [folderName, setFolderName] = useState("");
  const [imageCount, setImageCount] = useState(0);
  const [csvCount, setCsvCount] = useState(0);
  const [reading, setReading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [notice, setNotice] = useState<string>();
  const [progress, setProgress] = useState<ImportProgress>();
  const [result, setResult] = useState<ImportResult>();
  /** A saved preview is being read from IndexedDB. */
  const [restoring, setRestoring] = useState(true);
  /** The preview currently on screen came from a saved session. */
  const [restored, setRestored] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "unavailable">("idle");
  const [savedAt, setSavedAt] = useState<number>();

  const groupsRef = useRef(groups);
  groupsRef.current = groups;
  const categoriesRef = useRef(categories);
  categoriesRef.current = categories;
  const folderFilesRef = useRef(folderFiles);
  folderFilesRef.current = folderFiles;
  const extraCsvFilesRef = useRef(extraCsvFiles);
  extraCsvFilesRef.current = extraCsvFiles;
  const existingIndexRef = useRef<Map<string, Antique[]>>(new Map());
  existingIndexRef.current = existingIndex(existingAntiques);
  const designersRef = useRef(designers);
  designersRef.current = designers;
  const categorySourceRef = useRef(categorySource);
  categorySourceRef.current = categorySource;
  /** Lets a newer folder/CSV selection cancel an older, still-reading one. */
  const readRun = useRef(0);
  /** Stops a late IndexedDB restore from replacing a folder the curator has already chosen. */
  const sessionTouched = useRef(false);
  const snapshotRef = useRef<ImportSessionInput | undefined>(undefined);
  const previews = useRef<string[]>([]);
  const releasePreviews = () => {
    previews.current.forEach((url) => URL.revokeObjectURL(url));
    previews.current = [];
  };
  useEffect(() => () => releasePreviews(), []);

  // A preview the curator saved earlier - or simply left this page with - is restored with its
  // files. `sessionTouched` protects a folder chosen while IndexedDB was still answering.
  useEffect(() => {
    let active = true;
    void loadImportSession().then((saved) => {
      if (!active) return;
      setRestoring(false);
      if (!saved || sessionTouched.current
          || groupsRef.current.length > 0 || folderFilesRef.current.length > 0) return;
      const restoredGroups = saved.groups.map((group) => {
        const images = group.images.map((image) => ({
          ...image,
          file: restoreFilePath(image.file, image.path),
        }));
        const previewUrl = images[0] ? URL.createObjectURL(images[0].file) : "";
        if (previewUrl) previews.current.push(previewUrl);
        return {
          ...group,
          images,
          previewUrl,
          status: group.status === "saving" ? "pending" as const : group.status,
        };
      });
      setGroups(restoredGroups);
      setFolderFiles(saved.folderFiles.map(({ path, file }) => restoreFilePath(file, path)));
      setExtraCsvFiles(saved.extraCsvFiles.map(({ path, file }) => restoreFilePath(file, path)));
      setRecords(saved.records);
      setParseIssues(saved.parseIssues);
      setIssues(saved.issues);
      setGroupingState(saved.grouping);
      setCategorySource(saved.categorySource);
      setFolderName(saved.folderName);
      setImageCount(saved.imageCount);
      setCsvCount(saved.csvCount);
      setSavedAt(saved.savedAt);
      setRestored(true);
    }).catch(() => {
      if (active) setRestoring(false);
    });
    return () => { active = false; };
  }, []);

  // The latest preview, used by the save button and by the automatic save when the page is left.
  snapshotRef.current = groups.length === 0 ? undefined : {
    folderFiles: folderFiles.map(storedFile),
    extraCsvFiles: extraCsvFiles.map(storedFile),
    groups: groups.map(storedGroup),
    records,
    parseIssues,
    issues,
    grouping,
    categorySource,
    folderName,
    imageCount,
    csvCount,
  };

  const saveForLater = async (): Promise<void> => {
    const session = snapshotRef.current;
    if (!session) return;
    setSaveState("saving");
    const saved = await saveImportSession(session);
    setSaveState(saved ? "saved" : "unavailable");
    if (saved) setSavedAt(Date.now());
  };

  // IndexedDB cannot be written reliably from `beforeunload`; a hidden page and the component's
  // unmount are the two moments that happen before the tab goes away or the route changes.
  useEffect(() => {
    const persist = () => {
      const session = snapshotRef.current;
      if (session) void saveImportSession(session);
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") persist();
    };
    window.addEventListener("pagehide", persist);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("pagehide", persist);
      document.removeEventListener("visibilitychange", onVisibility);
      persist();
    };
  }, []);

  useEffect(() => {
    getVisibleCategories()
      .then((items) => { setCategories(items); setCategoriesError(undefined); })
      .catch(() => setCategoriesError("categoriesCouldNotLoad"));
  }, []);

  // Titles like `Stoel by John Doe` name an artist. The whole directory is small enough to read
  // once, which lets the preview fill in the artist without a search call per row.
  useEffect(() => {
    getAllDesigners().then(setDesigners).catch(() => undefined);
  }, []);

  // If the directory arrives after a folder was read, fill in the artists it can match.
  useEffect(() => {
    if (designers.length === 0) return;
    const index = designerIndex(designers);
    setGroups((current) => {
      let changed = false;
      const next = current.map((group) => {
        if (group.artist || !group.artistName) return group;
        const match = designerForName(index, group.artistName);
        if (!match) return group;
        changed = true;
        return { ...group, artist: match };
      });
      return changed ? next : current;
    });
  }, [designers]);

  // The import is an upsert. Without the existing inventory, a title that is already in the
  // gallery would be created a second time, so the page waits for this list before importing.
  useEffect(() => {
    let active = true;
    getAllAntiques()
      .then((items) => {
        if (!active) return;
        setExistingAntiques(items);
        setExistingError(undefined);
      })
      .catch(() => {
        if (active) setExistingError("importExistingLoadFailed");
      })
      .finally(() => {
        if (active) setExistingLoading(false);
      });
    return () => { active = false; };
  }, []);

  // A folder can be read before the category list arrives. Once it does, the category the CSV named
  // - or the one the folders name - is filled in; a piece the admin already assigned keeps their
  // choice. A CSV category that matches nothing stays empty so the curator is asked, rather than
  // silently falling back to a folder that may not mean the same thing.
  useEffect(() => {
    if (categories.length === 0) return;
    setGroups((current) => {
      let changed = false;
      const next = current.map((group) => {
        if (group.categoryId) return group;
        const id = group.category
          ? categoryIdFor(group.category, categories)
          : matchCategoryPath(group.categoryPath, categories).id
            || (group.categoryPath.length === 0 && group.existing?.category
              ? categoryIdFor(group.existing.category, categories)
              : "");
        if (!id) return group;
        changed = true;
        return { ...group, categoryId: id };
      });
      return changed ? next : current;
    });
  }, [categories]);

  /**
   * Adds what the existing piece already knows. A blank import field is filled from the existing
   * record so it cannot overwrite it with nothing; a value the import does supply wins. The artist
   * and category are filled the same way, which is what lets a row whose CSV only has a title and
   * price update an existing piece without asking the curator to enter everything again.
   */
  function attachExisting(group: ImportGroupDraft): ImportGroupDraft {
    const match = matchExisting(existingIndexRef.current, group.title);
    const existing = match.existing;
    const existingCategory = existing?.category ? categoryIdFor(existing.category, categoriesRef.current) : "";
    const folderCategory = matchCategoryPath(group.categoryPath, categoriesRef.current);
    // A folder category that exists is taken as the imported value. One that does not exist stays
    // empty: the comparison can then show it beside the gallery's category and the curator decides
    // whether to create it. A CSV category that matches nothing falls back to the existing value,
    // as before, while the issue list asks which category was meant.
    const categoryId = group.categoryId
      || categoryIdFor(group.category, categoriesRef.current)
      || (!group.category
        ? folderCategory.id || (group.categoryPath.length === 0 ? existingCategory : "")
        : existingCategory);
    return {
      ...group,
      existing,
      existingAmbiguous: match.ambiguous,
      // A parsed `by Artist` is an imported value even when the artist is not in the directory yet:
      // leaving it empty lets the comparison show it, and the import creates it when taken.
      artist: group.artist ?? (group.artistName ? undefined : artistFromExisting(existing)),
      categoryId,
      price: group.price.trim() ? group.price : existing?.price != null ? String(existing.price) : "",
      description: group.description.trim() ? group.description : existing?.description ?? "",
    };
  }

  // The inventory list can arrive after a folder has been read, and a title can be edited after
  // either. Re-evaluate the match when it does; the group keeps whatever the curator has typed.
  useEffect(() => {
    if (existingLoading) return;
    setGroups((current) => {
      let changed = false;
      const next = current.map((group) => {
        const match = matchExisting(existingIndexRef.current, group.title);
        if (group.existing?.id === match.existing?.id && group.existingAmbiguous === match.ambiguous) return group;
        changed = true;
        return attachExisting(group);
      });
      return changed ? next : current;
    });
  }, [existingAntiques, existingLoading]);

  function applyBuild(build: ImportBuild, csvRecords: CsvRecord[], csvIssues: ImportIssue[]): void {
    releasePreviews();
    const artists = designerIndex(designersRef.current);
    const drafts = build.groups.map((group): ImportGroupDraft => {
      const previewUrl = URL.createObjectURL(group.images[0].file);
      previews.current.push(previewUrl);
      return attachExisting({
        ...group,
        selected: true,
        status: "pending",
        uploadedCount: 0,
        previewUrl,
        // A category the CSV names wins; otherwise the piece is filed where its folders say. A path
        // that matches nothing yet stays empty and is created before the piece is saved.
        categoryId: categoryIdFor(group.category, categoriesRef.current)
          || matchCategoryPath(group.categoryPath, categoriesRef.current).id
          || "",
        // An artist already in the directory is filled in; one that is not yet there is created
        // before the piece is saved, so the curator does not have to type it by hand.
        artist: designerForName(artists, group.artistName),
        overrides: {},
        confirmed: false,
        addImages: true,
      });
    });
    const ambiguousIssues: ImportIssue[] = drafts
      .filter((group) => group.existingAmbiguous)
      .map((group) => ({ key: "importExistingAmbiguous", params: { title: group.title } }));
    const nextIssues = [...build.issues, ...csvIssues, ...ambiguousIssues];
    if (csvRecords.length === 0) nextIssues.push({ key: "importNoCsv" });
    setGroups(drafts);
    setIssues(nextIssues);
    setImageCount(build.imageCount);
    setCsvCount(build.csvCount);
    setResult(undefined);
    setNotice(undefined);
  }

  const patchGroup = useCallback((id: string, patch: Partial<ImportGroupDraft>) => {
    setGroups((current) => current.map((group) => group.id === id ? { ...group, ...patch } : group));
  }, []);

  async function readCsvFiles(files: File[]): Promise<{ sources: CsvSource[]; issues: ImportIssue[] }> {
    const sources: CsvSource[] = [];
    const issues: ImportIssue[] = [];
    for (const file of files) {
      const name = filePath(file);
      try {
        const text = await readCsvText(file);
        // Two files can share a basename when one comes from the folder and one is picked
        // separately. A distinct source name keeps their row numbers from colliding.
        const sourceName = sources.some((source) => source.name === name) ? `${name} (${sources.length + 1})` : name;
        sources.push({ name: sourceName, text });
      } catch {
        issues.push({ key: "folderReadError", params: { name } });
      }
    }
    return { sources, issues };
  }

  /** Re-reads the CSVs and rebuilds the preview from the current folder and CSV selection. */
  async function rebuild(folder: File[], extras: File[], mode: CsvGrouping, source: ImportCategorySource): Promise<void> {
    const run = ++readRun.current;
    setReading(true);
    setNotice(undefined);
    setResult(undefined);

    const combined = mergeFileSets(folder, extras);
    const csvFiles = combined.filter((file) => !isIgnoredFile(file) && isCsvFile(file));
    const read = await readCsvFiles(csvFiles);
    if (run !== readRun.current) return;

    const parsed = parseCsvSources(read.sources);
    const csvIssues: ImportIssue[] = [
      ...read.issues,
      ...parsed.issues.map((issue) => ({
        key: issue.key,
        params: { source: issue.source, line: issue.line ?? "", value: issue.value ?? "" },
      })),
    ];
    const build = buildImportGroups(combined, parsed.records, mode, source);
    setRecords(parsed.records);
    setParseIssues(csvIssues);
    applyBuild(build, parsed.records, csvIssues);
    setReading(false);
  }

  const selectFolder = (input: FileList | File[] | null): void => {
    const files = Array.from(input ?? []);
    if (files.length === 0) return;
    sessionTouched.current = true;
    folderFilesRef.current = files;
    setFolderFiles(files);
    const firstPath = filePath(files[0]);
    setFolderName(firstPath.includes("/") ? firstPath.split("/")[0] : "");
    // The CSV picker is independent: a folder chosen before or after the CSVs keeps both.
    void rebuild(files, extraCsvFilesRef.current, grouping, categorySourceRef.current);
  };

  const selectCsvFiles = (input: FileList | File[] | null): void => {
    const files = Array.from(input ?? []).filter((file) => !isIgnoredFile(file) && isCsvFile(file));
    if (files.length === 0) return;
    sessionTouched.current = true;
    extraCsvFilesRef.current = files;
    setExtraCsvFiles(files);
    void rebuild(folderFilesRef.current, files, grouping, categorySourceRef.current);
  };

  const clearFolder = (): void => {
    readRun.current += 1;
    sessionTouched.current = true;
    snapshotRef.current = undefined;
    releasePreviews();
    void clearImportSession();
    folderFilesRef.current = [];
    extraCsvFilesRef.current = [];
    setGroups([]);
    setFolderFiles([]);
    setExtraCsvFiles([]);
    setRecords([]);
    setParseIssues([]);
    setIssues([]);
    setFolderName("");
    setImageCount(0);
    setCsvCount(0);
    setGroupingState("folder");
    setNotice(undefined);
    setProgress(undefined);
    setResult(undefined);
    setReading(false);
    setRestored(false);
    setSaveState("idle");
    setSavedAt(undefined);
  };

  /** Rebuilds the preview when the admin changes how photographs become pieces. */
  const changeGrouping = (next: CsvGrouping): void => {
    if (next === grouping) return;
    setGroupingState(next);
    const combined = mergeFileSets(folderFilesRef.current, extraCsvFilesRef.current);
    if (combined.length === 0) return;
    applyBuild(buildImportGroups(combined, records, next, categorySourceRef.current), records, parseIssues);
  };

  /**
   * Rebuilds the preview when the admin says where the category folders start: at the children of
   * the picked folder, or at the picked folder itself.
   */
  const changeCategorySource = (next: ImportCategorySource): void => {
    if (next === categorySourceRef.current) return;
    categorySourceRef.current = next;
    setCategorySource(next);
    const combined = mergeFileSets(folderFilesRef.current, extraCsvFilesRef.current);
    if (combined.length === 0) return;
    applyBuild(buildImportGroups(combined, records, grouping, next), records, parseIssues);
  };

  const updateGroup = (id: string, field: "title" | "description" | "price", value: string): void => {
    setGroups((current) => current.map((group) => {
      if (group.id !== id) return group;
      // Editing a value after a confirmation invalidates that confirmation: the admin has to look
      // at the differences that are on screen now, not the ones that were there a moment ago.
      const next = { ...group, [field]: value, error: undefined, confirmed: false };
      if (field === "title") {
        const match = matchExisting(existingIndexRef.current, value);
        next.existing = match.existing;
        next.existingAmbiguous = match.ambiguous;
        next.artist = group.artist ?? artistFromExisting(match.existing);
        next.categoryId = group.categoryId
          || categoryIdFor(match.existing?.category ?? undefined, categoriesRef.current);
        next.price = group.price.trim() ? group.price : match.existing?.price != null ? String(match.existing.price) : "";
        next.description = group.description.trim() ? group.description : match.existing?.description ?? "";
      }
      return next;
    }));
  };

  const updateGroupCategory = (id: string, categoryId: string): void => {
    patchGroup(id, { categoryId, error: undefined, confirmed: false });
  };

  /** Ticks or unticks one field of one piece; the import applies exactly the ticked ones. */
  const setOverride = (id: string, field: ImportField, override: boolean): void => {
    setGroups((current) => current.map((group) => group.id === id
      ? { ...group, overrides: { ...group.overrides, [field]: override } }
      : group));
  };

  /** The admin's confirmation that this piece's differences were reviewed. */
  const confirmGroup = (id: string, confirmed: boolean): void => patchGroup(id, { confirmed });

  /** Whether the folder's photographs are added to a piece that already has some. */
  const setAddImages = (id: string, addImages: boolean): void => patchGroup(id, { addImages });

  const toggleGroup = (id: string, selected: boolean): void => patchGroup(id, { selected });
  const toggleAll = (ids: string[], selected: boolean): void => {
    setGroups((current) => current.map((group) =>
      ids.includes(group.id) && group.status !== "saved" ? { ...group, selected } : group));
  };
  /** Selects exactly these rows, which is how the ready group is imported without the others. */
  const selectOnly = (ids: string[]): void => {
    setGroups((current) => current.map((group) =>
      group.status === "saved" ? group : { ...group, selected: ids.includes(group.id) }));
  };

  const assignArtist = useCallback((designer: Designer): void => {
    const selected = groupsRef.current.filter((group) => group.selected && group.status !== "saved");
    if (selected.length === 0) {
      setNotice("importSelectPiecesFirst");
      return;
    }
    setGroups((current) => current.map((group) =>
      group.selected && group.status !== "saved"
        ? { ...group, artist: designer, error: undefined, confirmed: false }
        : group));
    setNotice(undefined);
  }, []);

  /** Assigns one category - a main category or a subcategory - to every selected piece. */
  const assignCategory = useCallback((categoryId: string): void => {
    const selected = groupsRef.current.filter((group) => group.selected && group.status !== "saved");
    if (selected.length === 0) {
      setNotice("importSelectPiecesFirst");
      return;
    }
    setGroups((current) => current.map((group) =>
      group.selected && group.status !== "saved"
        ? { ...group, categoryId, error: undefined, confirmed: false }
        : group));
    setNotice(undefined);
  }, []);

  const importSelected = async (): Promise<void> => {
    const targets = groupsRef.current.filter((group) => group.selected && group.status !== "saved");
    if (targets.length === 0) {
      setNotice("importSelectPiecesFirst");
      return;
    }
    const priceOf = (group: ImportGroupDraft) =>
      group.price.trim() || (group.existing?.price != null ? String(group.existing.price) : "");
    if (targets.some((group) => group.existingAmbiguous)) {
      setNotice("importExistingAmbiguous");
      return;
    }
    // A `Title by Artist` folder supplies the artist even before a record exists; the import creates
    // it. A single-word name cannot be created through the designer API (it needs a first and a
    // last name), so that row waits for the curator to pick or create the artist.
    const canCreateArtist = (name?: string) =>
      Boolean(name && name.trim().split(/\s+/).filter(Boolean).length >= 2);
    if (targets.some((group) => !group.existing && !group.artist && !canCreateArtist(group.artistName))) {
      setNotice("importNeedsArtist");
      return;
    }
    if (targets.some((group) => !group.existing && !group.categoryId
        && (group.categoryPath.length === 0 || Boolean(group.category)))) {
      // A folder path that exists nowhere is not a reason to block: the import creates it. A CSV
      // that names an unknown category is, because the CSV is the explicit instruction.
      setNotice("importNeedsCategory");
      return;
    }
    if (targets.some((group) => {
      const price = group.price.trim();
      if (!group.title.trim()) return true;
      if (!price) return !group.existing;
      return !Number.isFinite(Number(price)) || Number(price) < 0;
    })) {
      setNotice("importNeedsDetails");
      return;
    }
    // A piece that is already in the gallery is only updated after its differences were shown and
    // the admin confirmed them. Nothing is overwritten silently.
    if (targets.some((group) => group.existing && !group.confirmed
        && importDifferences(group, group.existing, categoriesRef.current).length > 0)) {
      setNotice("importNeedsConfirmation");
      return;
    }

    setImporting(true);
    setNotice(undefined);
    setResult(undefined);
    let imported = 0;
    let updated = 0;
    let failed = 0;

    // The categories the folders name are created as they are needed. One cache for the whole run
    // means the first "Boeken" creates the main category and every later "Boeken" reuses it; the
    // full list is only fetched when a creation collides with a hidden category or another import.
    let categoryCache = buildCategoryCache(categoriesRef.current);
    let createdCategories = false;
    const ensureCategory = async (name: string, parentId?: string): Promise<Category> => {
      const key = categoryNameKey(name, parentId);
      const known = categoryCache.get(key);
      if (known) return known;
      try {
        const created = await createCategory(name, parentId);
        categoryCache.set(key, created);
        createdCategories = true;
        return created;
      } catch (error) {
        const all = await getAllCategories();
        categoryCache = buildCategoryCache(flattenAllCategories(all));
        const found = categoryCache.get(key);
        if (!found) throw error;
        return found;
      }
    };
    const categoryForPath = async (path: string[]): Promise<string> => {
      const main = await ensureCategory(path[0]);
      return path.length > 1 ? (await ensureCategory(path[1], main.id)).id : main.id;
    };

    // The directory the page loaded is enough to reuse an artist; if it could not be loaded, ask
    // once so the import does not create a duplicate of an artist that already exists.
    let artistCache = designerIndex(designersRef.current);
    if (designersRef.current.length === 0) {
      try {
        artistCache = designerIndex(await getAllDesigners());
      } catch {
        // Creating the artist below is still better than losing the piece.
      }
    }
    const ensureArtist = async (name: string): Promise<Designer> => {
      const known = designerForName(artistCache, name);
      if (known) return known;
      const parts = artistNameParts(name);
      if (!parts) throw new Error("The artist needs a first and a last name.");
      const created = await createDesigner({ ...parts, middleName: null });
      for (const key of designerKeys(created)) artistCache.set(titleKey(key), created);
      // Keep the page's directory in step too, so a second import in the same visit reuses this
      // artist instead of creating a duplicate of it.
      designersRef.current = [...designersRef.current, created];
      setDesigners(designersRef.current);
      return created;
    };

    for (let index = 0; index < targets.length; index += 1) {
      const target = targets[index];
      setProgress({ current: index + 1, total: targets.length, title: target.title });
      patchGroup(target.id, { status: "saving", error: undefined });

      let targetId = target.createdId;
      let uploadedCount = target.uploadedCount;
      let categoryId = target.categoryId;
      let categoryError = false;
      let artistId = target.artist?.id;
      let artistError = false;
      try {
        // The folder hierarchy is a category instruction: make the category before the piece that
        // belongs in it, so a new catalogue can be imported in one pass. An existing piece only
        // gets a category created when the curator ticked the override beside it.
        if (!targetId && !categoryId && target.categoryPath.length > 0
            && (!target.existing || Boolean(target.overrides.category))) {
          try {
            categoryId = await categoryForPath(target.categoryPath);
          } catch (error) {
            categoryError = true;
            throw error;
          }
          patchGroup(target.id, { categoryId });
        }
        // The same for a `Title by Artist` folder: an artist that is not in the directory yet is
        // created before the piece, and reused by every later row in the run.
        if (!artistId && target.artistName
            && (!target.existing || Boolean(target.overrides.artist))) {
          try {
            const artist = await ensureArtist(target.artistName);
            artistId = artist.id;
            patchGroup(target.id, { artist });
          } catch (error) {
            artistError = true;
            throw error;
          }
        }
        if (!targetId) {
          const priceText = priceOf(target);
          const price = priceText ? Number(priceText) : undefined;
          const existing = target.existing;
          // Only the values the admin ticked replace what the gallery has. An unticked field keeps
          // the existing piece's value, even when the CSV carried a different one.
          const differences = existing ? importDifferences(target, existing, categoriesRef.current) : [];
          const differs = (field: ImportField) => differences.some((difference) => difference.field === field);
          const takes = (field: ImportField) => !differs(field) || Boolean(target.overrides[field]);
          const title = existing && !target.overrides.title ? existing.title : target.title.trim();
          // A blank import field keeps what the existing piece already says. Sending an empty
          // description would erase it, which is exactly the data loss this import must avoid.
          const description = existing && !target.overrides.description
            ? existing.description ?? ""
            : target.description.trim() ? target.description : existing?.description ?? "";
          const chosenArtistId = takes("artist") ? artistId ?? existing?.artist?.id : existing?.artist?.id;
          // Omitted means "keep the category already on the piece"; the API cannot clear it.
          const chosenCategoryId = takes("category") ? categoryId || undefined : undefined;
          if (existing) {
            await updateAntique(existing.id, {
              title,
              description,
              price: (takes("price") ? price ?? existing.price : existing.price) ?? undefined,
              artistId: chosenArtistId,
              categoryId: chosenCategoryId,
            });
            targetId = existing.id;
          } else {
            const created = await addAntique({
              title,
              artistId: chosenArtistId!,
              categoryId: chosenCategoryId,
              description,
              price: price!,
            });
            targetId = created.id;
          }
          patchGroup(target.id, { createdId: targetId });
        }
        if (target.addImages) {
          for (let imageIndex = uploadedCount; imageIndex < target.images.length; imageIndex += 1) {
            await uploadAntiqueImage(targetId, target.images[imageIndex].file);
            uploadedCount = imageIndex + 1;
            patchGroup(target.id, { uploadedCount });
          }
        } else {
          // The admin chose to keep the existing photographs; recording the count means a retry
          // does not quietly add them later.
          uploadedCount = target.images.length;
          patchGroup(target.id, { uploadedCount });
        }
        if (target.existing) updated += 1;
        else imported += 1;
        patchGroup(target.id, { status: "saved", selected: false, createdId: targetId, uploadedCount });
      } catch (error) {
        failed += 1;
        patchGroup(target.id, {
          status: "failed",
          createdId: targetId,
          uploadedCount,
          error: artistError
            ? "importArtistCreateFailed"
            : categoryError
              ? "importCategoryCreateFailed"
              : targetId ? imageErrorKey(error) : saveErrorKey(error),
        });
      }
    }

    if (createdCategories) {
      publishContentUpdate("categories");
      // Refresh the picker so the categories this run created can be chosen and edited at once.
      getVisibleCategories().then((items) => setCategories(items)).catch(() => undefined);
    }
    publishContentUpdate("antiques");
    setProgress(undefined);
    setImporting(false);
    setResult({ imported, failed, updated });
  };

  // A CSV can name a category the gallery does not have, or a name two categories share. The row
  // still imports once the admin picks one; this says which row is waiting for that choice.
  const categoryIssues: ImportIssue[] = categories.length === 0 ? [] : groups.flatMap((group): ImportIssue[] => {
    if (!group.category || group.categoryId) return [];
    const match = matchCategory(group.category, categories);
    if (match.status !== "unknown" && match.status !== "ambiguous") return [];
    return [{
      key: match.status === "unknown" ? "csvUnknownCategory" : "csvAmbiguousCategory",
      params: { source: group.record?.source ?? "", line: group.record?.line ?? "", value: group.category },
    }];
  });

  return {
    groups, grouping, categorySource, folderName, imageCount, csvCount, issues, reading, importing, notice, setNotice,
    progress, result, selectFolder, selectCsvFiles, clearFolder, changeGrouping, changeCategorySource,
    updateGroup, updateGroupCategory,
    toggleGroup, toggleAll, selectOnly, assignArtist, assignCategory, categories, categoriesError, categoryIssues, importSelected,
    existingLoading, existingError, setOverride, confirmGroup, setAddImages,
    restoring, restored, dismissRestored: () => setRestored(false), saveState, savedAt, saveForLater,
  };
}
