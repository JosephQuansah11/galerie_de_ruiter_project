/**
 * A tiny response cache for the gallery's read endpoints.
 *
 * The pages used to refetch the same public data (about copy, home copy, categories,
 * catalogue, location) on every navigation, so a slow or cold API made each visit wait
 * again. Responses are now memoised for a short window and reused across the whole
 * session, with identical in-flight requests shared instead of duplicated.
 *
 * Values live in memory for the current tab and in `sessionStorage` so a refresh keeps
 * the fast path too. Writes and content updates invalidate the affected entries, so the
 * gallery never shows data it just changed.
 */

type CacheEntry<T> = { value: T; expiresAt: number };

/** How long a cached response may be reused before it is fetched again. */
export const DEFAULT_CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * The cache is a session aid, not a database. Artist search creates a key for every query, so an
 * unbounded map would grow for as long as the tab stays open. Keep the newest entries and evict
 * the oldest, in memory and in the persisted copy.
 */
export const MAX_CACHE_ENTRIES = 100;

const STORAGE_PREFIX = "galerie-cache:";

const memory = new Map<string, CacheEntry<unknown>>();
const inFlight = new Map<string, Promise<unknown>>();
/** A response that started before a clear/invalidate must not put stale data back into the cache. */
let generation = 0;

function storageAvailable(): boolean {
  return typeof sessionStorage !== "undefined";
}

function readStored<T>(key: string): CacheEntry<T> | undefined {
  if (!storageAvailable()) return undefined;
  try {
    const raw = sessionStorage.getItem(STORAGE_PREFIX + key);
    return raw ? (JSON.parse(raw) as CacheEntry<T>) : undefined;
  } catch {
    return undefined;
  }
}

function writeStored<T>(key: string, entry: CacheEntry<T>): void {
  if (!storageAvailable()) return;
  try {
    sessionStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(entry));
  } catch {
    // A full or disabled storage must never break a request that already succeeded.
  }
}

function removeStored(key: string): void {
  if (!storageAvailable()) return;
  try {
    sessionStorage.removeItem(STORAGE_PREFIX + key);
  } catch {
    // Ignore storage failures.
  }
}

/** Drops expired entries and enforces the in-memory bound; the oldest entry goes first. */
function pruneMemory(): void {
  const now = Date.now();
  for (const [key, entry] of memory) {
    if (entry.expiresAt <= now) {
      memory.delete(key);
      removeStored(key);
    }
  }
  while (memory.size > MAX_CACHE_ENTRIES) {
    const oldest = memory.keys().next().value as string | undefined;
    if (!oldest) return;
    memory.delete(oldest);
    removeStored(oldest);
  }
}

/** Keeps the persisted cache from becoming an unbounded list of old searches. */
function pruneStored(): void {
  if (!storageAvailable()) return;
  try {
    const now = Date.now();
    const keys: string[] = [];
    for (let index = 0; index < sessionStorage.length; index += 1) {
      const fullKey = sessionStorage.key(index);
      if (fullKey?.startsWith(STORAGE_PREFIX)) keys.push(fullKey);
    }
    const valid: string[] = [];
    for (const fullKey of keys) {
      const raw = sessionStorage.getItem(fullKey);
      if (!raw) continue;
      try {
        const entry = JSON.parse(raw) as CacheEntry<unknown>;
        if (entry.expiresAt <= now) sessionStorage.removeItem(fullKey);
        else valid.push(fullKey);
      } catch {
        // A malformed entry is useless; remove it rather than letting it occupy quota.
        sessionStorage.removeItem(fullKey);
      }
    }
    while (valid.length > MAX_CACHE_ENTRIES) {
      const oldest = valid.shift();
      if (oldest) sessionStorage.removeItem(oldest);
    }
  } catch {
    // Ignore storage failures.
  }
}

/** A key belongs to a prefix when it matches exactly or is one of its sub-keys. */
function matchesPrefix(key: string, prefix: string): boolean {
  return key === prefix || key.startsWith(`${prefix}:`);
}

/** Returns a still-fresh cached value, or `undefined` when the entry is missing or stale. */
export function readCache<T>(key: string): T | undefined {
  const entry = (memory.get(key) as CacheEntry<T> | undefined) ?? readStored<T>(key);
  if (!entry) return undefined;
  if (entry.expiresAt <= Date.now()) {
    memory.delete(key);
    removeStored(key);
    return undefined;
  }
  // Re-inserting moves the key to the newest end of the Map, which is the LRU order.
  memory.delete(key);
  memory.set(key, entry);
  pruneMemory();
  return entry.value;
}

/** Stores a value under a key for the given window. */
export function writeCache<T>(key: string, value: T, ttlMs: number = DEFAULT_CACHE_TTL_MS): T {
  const entry: CacheEntry<T> = { value, expiresAt: Date.now() + ttlMs };
  memory.delete(key);
  memory.set(key, entry);
  pruneMemory();
  writeStored(key, entry);
  pruneStored();
  return value;
}

/** Drops every entry whose key matches the prefix (for example `home` clears `home:images`). */
export function invalidateCache(prefix: string): void {
  generation += 1;
  for (const key of [...memory.keys()]) {
    if (matchesPrefix(key, prefix)) memory.delete(key);
  }
  if (!storageAvailable()) return;
  try {
    for (let index = sessionStorage.length - 1; index >= 0; index -= 1) {
      const fullKey = sessionStorage.key(index);
      if (!fullKey || !fullKey.startsWith(STORAGE_PREFIX)) continue;
      if (matchesPrefix(fullKey.slice(STORAGE_PREFIX.length), prefix)) sessionStorage.removeItem(fullKey);
    }
  } catch {
    // Ignore storage failures.
  }
}

/** Empties the whole cache. Used when the signed-in identity changes. */
export function clearCache(): void {
  generation += 1;
  memory.clear();
  inFlight.clear();
  if (!storageAvailable()) return;
  try {
    for (let index = sessionStorage.length - 1; index >= 0; index -= 1) {
      const fullKey = sessionStorage.key(index);
      if (fullKey?.startsWith(STORAGE_PREFIX)) sessionStorage.removeItem(fullKey);
    }
  } catch {
    // Ignore storage failures.
  }
}

/**
 * Returns the cached response for `key`, or runs `loader` once and caches the result.
 * Concurrent callers for the same key share a single request.
 */
export async function cachedRequest<T>(
  key: string,
  loader: () => Promise<T>,
  ttlMs: number = DEFAULT_CACHE_TTL_MS,
): Promise<T> {
  const cached = readCache<T>(key);
  if (cached !== undefined) return cached;

  const pending = inFlight.get(key) as Promise<T> | undefined;
  if (pending) return pending;

  const requestGeneration = generation;
  const request = loader()
    .then((value) => requestGeneration === generation ? writeCache(key, value, ttlMs) : value)
    .finally(() => {
      inFlight.delete(key);
    });
  inFlight.set(key, request);
  return request;
}
