import { clearCache, cachedRequest, invalidateCache, readCache, writeCache } from "./apiCache";

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
});
