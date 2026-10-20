import { useCallback, useEffect, useRef, useState } from "react";
import { addAntique, getAllAntiques, getVisibleCategories, updateAntique, uploadAntiqueImage } from "@/apis/backend_api";
import type Antique from "@/models/antiques/Antique";
import type { Category, Designer } from "@/models/antiques/Antique";
import { publishContentUpdate } from "@/services/contentUpdates";
import { saveErrorKey } from "@/pages/antiques/antiqueSaveErrors";
import { categoryIdFor, matchCategory } from "./categoryMatching";
import { existingIndex, matchExisting } from "./existingMatching";
import {
  buildImportGroups,
  filePath,
  isCsvFile,
  isIgnoredFile,
  type ImportBuild,
  type ImportGroup,
  type ImportIssue,
} from "./buildImportGroups";
import { parseCsvSources, type CsvGrouping, type CsvRecord, type CsvSource } from "./csv";

export type ImportStatus = "pending" | "saving" | "saved" | "failed";

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
  const [existingAntiques, setExistingAntiques] = useState<Antique[]>([]);
  const [existingLoading, setExistingLoading] = useState(true);
  const [existingError, setExistingError] = useState<string>();
  const [grouping, setGroupingState] = useState<CsvGrouping>("folder");
  const [folderName, setFolderName] = useState("");
  const [imageCount, setImageCount] = useState(0);
  const [csvCount, setCsvCount] = useState(0);
  const [reading, setReading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [notice, setNotice] = useState<string>();
  const [progress, setProgress] = useState<ImportProgress>();
  const [result, setResult] = useState<ImportResult>();

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
  /** Lets a newer folder/CSV selection cancel an older, still-reading one. */
  const readRun = useRef(0);
  const previews = useRef<string[]>([]);
  const releasePreviews = () => {
    previews.current.forEach((url) => URL.revokeObjectURL(url));
    previews.current = [];
  };
  useEffect(() => () => releasePreviews(), []);

  useEffect(() => {
    getVisibleCategories()
      .then((items) => { setCategories(items); setCategoriesError(undefined); })
      .catch(() => setCategoriesError("categoriesCouldNotLoad"));
  }, []);

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

  // A folder can be read before the category list arrives. Once it does, the categories the CSV
  // named are filled in; a piece the admin already assigned keeps their choice.
  useEffect(() => {
    if (categories.length === 0) return;
    setGroups((current) => {
      let changed = false;
      const next = current.map((group) => {
        if (group.categoryId) return group;
        const source = group.category || group.existing?.category;
        if (!source) return group;
        const id = categoryIdFor(source, categories);
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
    return {
      ...group,
      existing,
      existingAmbiguous: match.ambiguous,
      artist: group.artist ?? artistFromExisting(existing),
      categoryId: group.categoryId || categoryIdFor(group.category, categoriesRef.current) || existingCategory,
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
    const drafts = build.groups.map((group): ImportGroupDraft => {
      const previewUrl = URL.createObjectURL(group.images[0].file);
      previews.current.push(previewUrl);
      return attachExisting({
        ...group,
        selected: true,
        status: "pending",
        uploadedCount: 0,
        previewUrl,
        categoryId: categoryIdFor(group.category, categoriesRef.current),
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
  async function rebuild(folder: File[], extras: File[], mode: CsvGrouping): Promise<void> {
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
    const build = buildImportGroups(combined, parsed.records, mode);
    setRecords(parsed.records);
    setParseIssues(csvIssues);
    applyBuild(build, parsed.records, csvIssues);
    setReading(false);
  }

  const selectFolder = (input: FileList | File[] | null): void => {
    const files = Array.from(input ?? []);
    if (files.length === 0) return;
    folderFilesRef.current = files;
    setFolderFiles(files);
    const firstPath = filePath(files[0]);
    setFolderName(firstPath.includes("/") ? firstPath.split("/")[0] : "");
    // The CSV picker is independent: a folder chosen before or after the CSVs keeps both.
    void rebuild(files, extraCsvFilesRef.current, grouping);
  };

  const selectCsvFiles = (input: FileList | File[] | null): void => {
    const files = Array.from(input ?? []).filter((file) => !isIgnoredFile(file) && isCsvFile(file));
    if (files.length === 0) return;
    extraCsvFilesRef.current = files;
    setExtraCsvFiles(files);
    void rebuild(folderFilesRef.current, files, grouping);
  };

  const clearFolder = (): void => {
    readRun.current += 1;
    releasePreviews();
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
  };

  /** Rebuilds the preview when the admin changes how photographs become pieces. */
  const changeGrouping = (next: CsvGrouping): void => {
    if (next === grouping) return;
    setGroupingState(next);
    const combined = mergeFileSets(folderFilesRef.current, extraCsvFilesRef.current);
    if (combined.length === 0) return;
    applyBuild(buildImportGroups(combined, records, next), records, parseIssues);
  };

  const updateGroup = (id: string, field: "title" | "description" | "price", value: string): void => {
    setGroups((current) => current.map((group) => {
      if (group.id !== id) return group;
      const next = { ...group, [field]: value, error: undefined };
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
    patchGroup(id, { categoryId, error: undefined });
  };

  const toggleGroup = (id: string, selected: boolean): void => patchGroup(id, { selected });
  const toggleAll = (ids: string[], selected: boolean): void => {
    setGroups((current) => current.map((group) =>
      ids.includes(group.id) && group.status !== "saved" ? { ...group, selected } : group));
  };

  const assignArtist = useCallback((designer: Designer): void => {
    const selected = groupsRef.current.filter((group) => group.selected && group.status !== "saved");
    if (selected.length === 0) {
      setNotice("importSelectPiecesFirst");
      return;
    }
    setGroups((current) => current.map((group) =>
      group.selected && group.status !== "saved" ? { ...group, artist: designer, error: undefined } : group));
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
      group.selected && group.status !== "saved" ? { ...group, categoryId, error: undefined } : group));
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
    if (targets.some((group) => !group.existing && !group.artist)) {
      setNotice("importNeedsArtist");
      return;
    }
    if (targets.some((group) => !group.existing && !group.categoryId)) {
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

    setImporting(true);
    setNotice(undefined);
    setResult(undefined);
    let imported = 0;
    let updated = 0;
    let failed = 0;

    for (let index = 0; index < targets.length; index += 1) {
      const target = targets[index];
      setProgress({ current: index + 1, total: targets.length, title: target.title });
      patchGroup(target.id, { status: "saving", error: undefined });

      let targetId = target.createdId;
      let uploadedCount = target.uploadedCount;
      try {
        if (!targetId) {
          const title = target.title.trim();
          const priceText = priceOf(target);
          const price = priceText ? Number(priceText) : undefined;
          // A blank import field keeps what the existing piece already says. Sending an empty
          // description would erase it, which is exactly the data loss this import must avoid.
          const description = target.description.trim()
            ? target.description
            : target.existing?.description ?? "";
          const artistId = target.artist?.id ?? target.existing?.artist?.id;
          const categoryId = target.categoryId || undefined;
          if (target.existing) {
            await updateAntique(target.existing.id, { title, description, price, artistId, categoryId });
            targetId = target.existing.id;
          } else {
            const created = await addAntique({
              title,
              artistId: artistId!,
              categoryId,
              description,
              price: price!,
            });
            targetId = created.id;
          }
          patchGroup(target.id, { createdId: targetId });
        }
        for (let imageIndex = uploadedCount; imageIndex < target.images.length; imageIndex += 1) {
          await uploadAntiqueImage(targetId, target.images[imageIndex].file);
          uploadedCount = imageIndex + 1;
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
          error: targetId ? imageErrorKey(error) : saveErrorKey(error),
        });
      }
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
    groups, grouping, folderName, imageCount, csvCount, issues, reading, importing, notice, setNotice,
    progress, result, selectFolder, selectCsvFiles, clearFolder, changeGrouping, updateGroup, updateGroupCategory,
    toggleGroup, toggleAll, assignArtist, assignCategory, categories, categoriesError, categoryIssues, importSelected,
    existingLoading, existingError,
  };
}
