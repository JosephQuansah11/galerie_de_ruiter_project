/**
 * Single source of truth for the API origins used by every frontend request.
 *
 * The CSRF token handshake is host-scoped: a token read from one host cannot be
 * sent to another host. Reading every base URL from this module keeps the token
 * request, the authenticated request and the avatar upload on the same origin in
 * development and in production.
 */
const javaApiFallback = "http://localhost:8080";
const pythonApiFallback = "http://localhost:8000";

function stripTrailingSlashes(value: string): string {
  return value.replace(/\/+$/, "");
}

function firstConfigured(candidates: Array<string | undefined>, fallback: string): string {
  const configured = candidates.find((value) => typeof value === "string" && value.trim().length > 0);
  return stripTrailingSlashes((configured ?? fallback).trim());
}

export const apiBaseUrl = firstConfigured(
  [import.meta.env.VITE_JAVA_API_URL, import.meta.env.VITE_JAVA_BACKEND_URL, import.meta.env.VITE_API_URL],
  javaApiFallback,
);

export const pythonApiBaseUrl = firstConfigured(
  [import.meta.env.VITE_PYTHON_API_URL, import.meta.env.VITE_RECONSTRUCTION_API_URL],
  pythonApiFallback,
);
