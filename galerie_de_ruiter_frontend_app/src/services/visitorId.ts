const STORAGE_KEY = "galerie-visitor-id";

/**
 * Stable identity for a visitor who is not signed in, so a piece counts one view and one
 * like per person instead of one per page load. Signed-in visitors are identified by their
 * token on the API side and do not need this.
 */
export function visitorId(): string {
  if (typeof window === "undefined") return "";
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) return stored;
    const created = typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `v-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    window.localStorage.setItem(STORAGE_KEY, created);
    return created;
  } catch {
    // Private mode or blocked storage: the counters simply do not count this visitor.
    return "";
  }
}
