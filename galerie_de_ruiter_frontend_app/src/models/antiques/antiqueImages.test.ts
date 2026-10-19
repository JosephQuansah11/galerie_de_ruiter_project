import { resolveAntiqueImageUrl, resolveAntiqueLargeUrl, resolveAntiqueMediumUrl, resolveAntiqueThumbnailUrl } from "./antiqueImages";

/**
 * A grid, a basket row and the strip under a piece all draw a photograph at a few hundred
 * pixels. Asking for the original there is the difference between forty kilobytes and six
 * megabytes per tile, so the URL helpers are pinned here.
 */
describe("antique image URLs", () => {
  it("asks for the small copy when the path names an image id", () => {
    const full = resolveAntiqueImageUrl("/api/antiques/piece-1/image/photo-1");

    expect(resolveAntiqueThumbnailUrl("/api/antiques/piece-1/image/photo-1")).toBe(`${full}/thumbnail`);
  });

  it("asks for the two responsive copies on a piece's page", () => {
    const full = resolveAntiqueImageUrl("/api/antiques/piece-1/image/photo-1");

    expect(resolveAntiqueMediumUrl("/api/antiques/piece-1/image/photo-1")).toBe(`${full}/medium`);
    expect(resolveAntiqueLargeUrl("/api/antiques/piece-1/image/photo-1")).toBe(`${full}/large`);
  });

  it("leaves the first-photograph path alone, because it has no variant route", () => {
    const path = "/api/antiques/piece-1/image";

    expect(resolveAntiqueThumbnailUrl(path)).toBe(resolveAntiqueImageUrl(path));
    expect(resolveAntiqueMediumUrl(path)).toBe(resolveAntiqueImageUrl(path));
    expect(resolveAntiqueLargeUrl(path)).toBe(resolveAntiqueImageUrl(path));
  });

  it("keeps an absolute URL absolute", () => {
    expect(resolveAntiqueThumbnailUrl("https://api.example/antiques/1/image/2"))
      .toBe("https://api.example/antiques/1/image/2/thumbnail");
    expect(resolveAntiqueMediumUrl("https://api.example/antiques/1/image/2"))
      .toBe("https://api.example/antiques/1/image/2/medium");
  });

  it("has nothing to resolve without a path", () => {
    expect(resolveAntiqueThumbnailUrl(undefined)).toBeUndefined();
    expect(resolveAntiqueThumbnailUrl("")).toBeUndefined();
    expect(resolveAntiqueMediumUrl(undefined)).toBeUndefined();
    expect(resolveAntiqueLargeUrl(undefined)).toBeUndefined();
  });
});