import { clearCache, cachedRequest, invalidateCache, MAX_CACHE_ENTRIES, readCache, writeCache } from "./apiCache";

describe("api response cache", () => {
  beforeEach(() => {
    sessionStorage.clear();
    clearCache();
  });

  it("runs the loader once and reuses the value", async () => {
    const loader = jest.fn().mockResolvedValue({ value: 1 });

    expect(await cachedRequest("test", loader)).toEqual({ value: 1 });
    expect(await cachedRequest("test", loader)).toEqual({ value: 1 });
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it("shares a single in-flight request between concurrent callers", async () => {
    const loader = jest.fn().mockResolvedValue([1, 2, 3]);

    const [first, second] = await Promise.all([
      cachedRequest("test", loader),
      cachedRequest("test", loader),
    ]);

    expect(first).toEqual([1, 2, 3]);
    expect(second).toEqual([1, 2, 3]);
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it("drops a topic and its sub-keys when invalidated", () => {
    writeCache("home", { heroTitle: "Hello" });
    writeCache("home:images", []);
    writeCache("about", { content: "story" });

    invalidateCache("home");

    expect(readCache("home")).toBeUndefined();
    expect(readCache("home:images")).toBeUndefined();
    expect(readCache("about")).toEqual({ content: "story" });
  });

  it("fetches again after the entry is invalidated", async () => {
    const loader = jest.fn().mockResolvedValue("first");

    await cachedRequest("test", loader);
    invalidateCache("test");
    expect(await cachedRequest("test", loader)).toBe("first");
    expect(loader).toHaveBeenCalledTimes(2);
  });

  it("keeps both the memory and session copies bounded", () => {
    for (let index = 0; index < MAX_CACHE_ENTRIES + 25; index += 1) {
      writeCache(`search:${index}`, index);
    }

    expect(readCache("search:0")).toBeUndefined();
    expect(readCache(`search:${MAX_CACHE_ENTRIES + 24}`)).toBe(MAX_CACHE_ENTRIES + 24);
    const stored = Array.from({ length: sessionStorage.length }, (_, index) => sessionStorage.key(index))
      .filter((key): key is string => Boolean(key?.startsWith("galerie-cache:")));
    expect(stored.length).toBeLessThanOrEqual(MAX_CACHE_ENTRIES);
  });

  it("removes an entry as soon as its TTL has passed", () => {
    writeCache("expired", "old", -1);
    writeCache("fresh", "new");

    expect(readCache("expired")).toBeUndefined();
    expect(readCache("fresh")).toBe("new");
  });

  it("keeps a recently read entry when the cache is full", () => {
    for (let index = 0; index < MAX_CACHE_ENTRIES; index += 1) {
      writeCache(`search:${index}`, index);
    }
    expect(readCache("search:0")).toBe(0);
    writeCache("search:new", "new");

    expect(readCache("search:0")).toBe(0);
    expect(readCache("search:1")).toBeUndefined();
  });
});
