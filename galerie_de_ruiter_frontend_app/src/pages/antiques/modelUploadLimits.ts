/**
 * Largest .glb the antique form will send to the gallery API.
 *
 * The API enforces the same number through `app.models.max-size-mb` (`MODELS_MAX_SIZE_MB`),
 * which defaults to 100 MB in production. Keeping the two in step means an oversized model
 * is rejected in the form with a clear message instead of reaching the server and failing
 * with a generic upload error, after the antique itself has already been saved.
 *
 * Raise this with `VITE_MODELS_MAX_SIZE_MB` when `MODELS_MAX_SIZE_MB` is raised on the API,
 * so the form and the server keep accepting the same files.
 */
const configuredMb = Number(import.meta.env.VITE_MODELS_MAX_SIZE_MB);

export const MODEL_MAX_SIZE_MB = Number.isFinite(configuredMb) && configuredMb > 0 ? configuredMb : 100;

export const MODEL_MAX_SIZE_BYTES = MODEL_MAX_SIZE_MB * 1024 * 1024;

/** True when the gallery API will accept this file as an antique model. */
export function isUploadableModel(file: File): boolean {
  return file.name.toLowerCase().endsWith(".glb") && file.size <= MODEL_MAX_SIZE_BYTES;
}
