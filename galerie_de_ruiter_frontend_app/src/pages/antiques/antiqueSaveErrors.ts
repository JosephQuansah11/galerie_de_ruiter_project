import axios from "axios";

/**
 * Message keys for the antique write endpoints, kept together so the forms and the admin
 * table describe the same failure the same way. The API rarely explains itself, so the
 * status is what tells the honest reason apart.
 */

/** Maps a failed antique request to the message key the form shows. */
export function saveErrorKey(error: unknown): string {
  if (!axios.isAxiosError(error)) return "antiqueCouldNotSave";
  const status = error.response?.status;
  if (status === 401 || status === 403) return "antiqueSavePermissionError";
  if (status === 400 || status === 422) return "antiqueSaveValidationError";
  if (!error.response) return "antiqueSaveConnectionError";
  return "antiqueCouldNotSave";
}

/**
 * Message key for a failed 3D model upload. A 413 (the file is too heavy for the server) and
 * a 5xx (the service ran out of memory and restarted) used to look like the same upload
 * failure, which left an oversized model indistinguishable from a broken server.
 */
export function modelUploadErrorKey(error: unknown): string {
  const base = saveErrorKey(error);
  if (base === "antiqueSavePermissionError") return base;
  if (base === "antiqueSaveValidationError") return "glbUploadInvalid";
  const status = axios.isAxiosError(error) ? error.response?.status : undefined;
  if (status === 413) return "antiqueModelTooLarge";
  if (status !== undefined && status >= 500) return "antiqueModelServerError";
  return "antiqueModelUploadFailed";
}

/**
 * Message key for a failed edit or delete. "Some antique details are missing or invalid" is
 * the wrong copy for those actions, so they only separate permission and connection problems
 * from the generic action failure.
 */
export function managementErrorKey(error: unknown): string {
  const base = saveErrorKey(error);
  if (base === "antiqueSavePermissionError" || base === "antiqueSaveConnectionError") return base;
  return "antiqueManagementActionFailed";
}

/** Leaves the precise cause in the console; the UI copy stays friendly. */
export function logRequestFailure(what: string, error: unknown): void {
  if (!axios.isAxiosError(error)) {
    console.error(`[${what}] unexpected failure`, error);
    return;
  }
  const status = error.response?.status;
  console.error(
    `[${what}] ${status === undefined ? "no response (network failure or timeout)" : `HTTP ${status}`}`,
    error.response?.data ?? error.message,
  );
}
