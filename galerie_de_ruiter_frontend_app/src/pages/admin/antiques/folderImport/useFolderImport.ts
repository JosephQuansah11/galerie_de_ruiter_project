import { useCallback, useEffect, useRef, useState } from "react";
import { addAntique, uploadAntiqueImage } from "@/apis/backend_api";
import type { Designer } from "@/models/antiques/Antique";
import { publishContentUpdate } from "@/services/contentUpdates";
import { saveErrorKey } from "@/pages/antiques/antiqueSaveErrors";
import {
  buildImportGroups,
  filePath,
  isCsvFile,
  isIgnoredFile,
  type ImportBuild,
  type ImportGroup,
  type ImportIssue,
} from "./buildImportGroups";
import { parseCsvSources, type CsvGrouping, type CsvRecord } from "./csv";

export type ImportStatus = "pending" | "saving" | "saved" | "failed";

export type ImportGroupDraft = ImportGroup & {
  selected: boolean;
  artist?: Designer;
  status: ImportStatus;
  /** The piece this row created; kept so a retry does not create it twice. */
  createdId?: string;
  uploadedCount: number;
  error?: string;
  previewUrl: string;
};

export type ImportProgress = { current: number; total: number; title: string };
export type ImportResult = { imported: number; failed: number };

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
 * Reads a folder in the browser, matches its CSVs to the images and creates the pieces one by one.
 * Nothing is uploaded until `importSelected` is called, so the admin can correct titles, prices and
 * the artist for the whole batch first.
 */
export function useFolderImport() {
  const [groups, setGroups] = useState<ImportGroupDraft[]>([]);
  const [rawFiles, setRawFiles] = useState<File[]>([]);
  const [records, setRecords] = useState<CsvRecord[]>([]);
  const [parseIssues, setParseIssues] = useState<ImportIssue[]>([]);
  const [issues, setIssues] = useState<ImportIssue[]>([]);
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
  const previews = useRef<string[]>([]);
  const releasePreviews = () => {
    previews.current.forEach((url) => URL.revokeObjectURL(url));
    previews.current = [];
  };
  useEffect(() => () => releasePreviews(), []);

  function applyBuild(build: ImportBuild, csvRecords: CsvRecord[], csvIssues: ImportIssue[]): void {
    releasePreviews();
    const drafts = build.groups.map((group): ImportGroupDraft => {
      const previewUrl = URL.createObjectURL(group.images[0].file);
      previews.current.push(previewUrl);
      return { ...group, selected: true, status: "pending", uploadedCount: 0, previewUrl };
    });
    const nextIssues = [...build.issues, ...csvIssues];
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

  const selectFiles = async (input: FileList | File[] | null): Promise<void> => {
    const files = Array.from(input ?? []);
    if (files.length === 0) return;
    setReading(true);
    setNotice(undefined);
    setResult(undefined);

    const sources = [];
    const readIssues: ImportIssue[] = [];
    for (const file of files.filter((entry) => !isIgnoredFile(entry) && isCsvFile(entry))) {
      try {
        sources.push({ name: file.name, text: await readCsvText(file) });
      } catch {
        readIssues.push({ key: "folderReadError", params: { name: file.name } });
      }
    }
    const parsed = parseCsvSources(sources);
    const csvIssues: ImportIssue[] = [
      ...readIssues,
      ...parsed.issues.map((issue) => ({
        key: issue.key,
        params: { source: issue.source, line: issue.line ?? "", value: issue.value ?? "" },
      })),
    ];
    const build = buildImportGroups(files, parsed.records, grouping);
    const firstPath = filePath(files[0]);

    setRawFiles(files);
    setRecords(parsed.records);
    setParseIssues(csvIssues);
    setFolderName(firstPath.includes("/") ? firstPath.split("/")[0] : "");
    applyBuild(build, parsed.records, csvIssues);
    setReading(false);
  };

  const clearFolder = (): void => {
    releasePreviews();
    setGroups([]);
    setRawFiles([]);
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
  };

  /** Rebuilds the preview when the admin changes how photographs become pieces. */
  const changeGrouping = (next: CsvGrouping): void => {
    if (next === grouping) return;
    setGroupingState(next);
    if (rawFiles.length === 0) return;
    applyBuild(buildImportGroups(rawFiles, records, next), records, parseIssues);
  };

  const updateGroup = (id: string, field: "title" | "description" | "price", value: string): void => {
    patchGroup(id, { [field]: value, error: undefined });
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

  const importSelected = async (): Promise<void> => {
    const targets = groupsRef.current.filter((group) => group.selected && group.status !== "saved");
    if (targets.length === 0) {
      setNotice("importSelectPiecesFirst");
      return;
    }
    if (targets.some((group) => !group.artist)) {
      setNotice("importNeedsArtist");
      return;
    }
    if (targets.some((group) => !group.title.trim() || !group.price.trim() || !Number.isFinite(Number(group.price)) || Number(group.price) < 0)) {
      setNotice("importNeedsDetails");
      return;
    }

    setImporting(true);
    setNotice(undefined);
    setResult(undefined);
    let imported = 0;
    let failed = 0;

    for (let index = 0; index < targets.length; index += 1) {
      const target = targets[index];
      setProgress({ current: index + 1, total: targets.length, title: target.title });
      patchGroup(target.id, { status: "saving", error: undefined });

      let createdId = target.createdId;
      let uploadedCount = target.uploadedCount;
      try {
        if (!createdId) {
          const created = await addAntique({
            title: target.title.trim(),
            artistId: target.artist!.id,
            description: target.description,
            price: Number(target.price),
          });
          createdId = created.id;
          patchGroup(target.id, { createdId });
        }
        for (let imageIndex = uploadedCount; imageIndex < target.images.length; imageIndex += 1) {
          await uploadAntiqueImage(createdId, target.images[imageIndex].file);
          uploadedCount = imageIndex + 1;
          patchGroup(target.id, { uploadedCount });
        }
        imported += 1;
        patchGroup(target.id, { status: "saved", selected: false, createdId, uploadedCount });
      } catch (error) {
        failed += 1;
        patchGroup(target.id, {
          status: "failed",
          createdId,
          uploadedCount,
          error: createdId ? imageErrorKey(error) : saveErrorKey(error),
        });
      }
    }

    publishContentUpdate("antiques");
    setProgress(undefined);
    setImporting(false);
    setResult({ imported, failed });
  };

  return {
    groups, grouping, folderName, imageCount, csvCount, issues, reading, importing, notice, setNotice,
    progress, result, selectFiles, clearFolder, changeGrouping, updateGroup, toggleGroup, toggleAll,
    assignArtist, importSelected,
  };
}
