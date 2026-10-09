import axios from "axios";

type ApiErrorBody = { message?: string; detail?: string; error?: string; status?: number };

/**
 * Turns a failed API call into a message that can be shown to a visitor. The API
 * reports the real reason (validation, missing session, CSRF, model warm-up) in the
 * response body, so surfacing it makes production problems diagnosable instead of a
 * generic "something went wrong".
 */
export function describeApiError(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const body = error.response?.data as ApiErrorBody | string | undefined;
    if (typeof body === "string" && body.trim().length > 0 && body.length < 300) return body;
    if (body && typeof body === "object") {
      const detail = body.message ?? body.detail ?? body.error;
      if (typeof detail === "string" && detail.trim().length > 0) return detail;
    }
    const status = error.response?.status;
    if (status === 401 || status === 403) return `${fallback} (session: ${status})`;
    if (status === 413) return `${fallback} (file too large)`;
    if (status === 415) return `${fallback} (unsupported file type)`;
    if (status) return `${fallback} (${status})`;
    if (error.code === "ECONNABORTED") return `${fallback} (request timed out)`;
  }
  if (error instanceof Error && error.message.trim().length > 0) return `${fallback} (${error.message})`;
  return fallback;
}
