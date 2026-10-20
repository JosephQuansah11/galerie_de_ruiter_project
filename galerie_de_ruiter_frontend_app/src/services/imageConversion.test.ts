import { isConvertible, isWebp, toWebp, toWebpFiles, webpName, WEBP_MIME } from "./imageConversion";

function imageFile(name: string, type: string, bytes = [1, 2, 3]): File {
  return new File([new Uint8Array(bytes)], name, { type });
}

const webpBlob = () => new Blob([new Uint8Array([9, 9])], { type: WEBP_MIME });

describe("converting photographs to WebP before upload", () => {
  const originalBitmap = Object.getOwnPropertyDescriptor(globalThis, "createImageBitmap");
  const originalContext = Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype, "getContext");
  const originalToBlob = Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype, "toBlob");
  let encoder: jest.Mock;
  let lastCanvas: HTMLCanvasElement | undefined;

  beforeEach(() => {
    Object.defineProperty(globalThis, "createImageBitmap", {
      configurable: true,
      writable: true,
      value: jest.fn(async () => ({ width: 1200, height: 800, close: jest.fn() })),
    });
    Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
      configurable: true,
      writable: true,
      value: jest.fn(function (this: HTMLCanvasElement) {
        lastCanvas = this;
        return { drawImage: jest.fn() };
      }),
    });
    lastCanvas = undefined;
    encoder = jest.fn((callback: BlobCallback) => callback(webpBlob()));
    Object.defineProperty(HTMLCanvasElement.prototype, "toBlob", {
      configurable: true,
      writable: true,
      value: encoder,
    });
  });

  afterEach(() => {
    const restore = (target: object, key: string, descriptor?: PropertyDescriptor) => {
      if (descriptor) Object.defineProperty(target, key, descriptor);
      else delete (target as Record<string, unknown>)[key];
    };
    restore(globalThis, "createImageBitmap", originalBitmap);
    restore(HTMLCanvasElement.prototype, "getContext", originalContext);
    restore(HTMLCanvasElement.prototype, "toBlob", originalToBlob);
  });

  it("re-encodes a JPEG and names it as the API expects", async () => {
    const original = imageFile("front.jpg", "image/jpeg");

    const converted = await toWebp(original);

    expect(converted).not.toBe(original);
    expect(converted.type).toBe(WEBP_MIME);
    expect(converted.name).toBe("front.webp");
    expect(converted.lastModified).toBe(original.lastModified);
    expect(encoder).toHaveBeenCalledWith(expect.any(Function), WEBP_MIME, expect.any(Number));
  });

  it("leaves a photograph that is already WebP alone", async () => {
    const webp = imageFile("front.webp", WEBP_MIME);

    expect(await toWebp(webp)).toBe(webp);
    expect(globalThis.createImageBitmap).not.toHaveBeenCalled();
  });

  it("leaves a GIF alone so an animation is not flattened", async () => {
    const gif = imageFile("wobble.gif", "image/gif");

    expect(isConvertible(gif)).toBe(false);
    expect(await toWebp(gif)).toBe(gif);
  });

  it("keeps the original when the browser has no canvas", async () => {
    Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
      configurable: true, writable: true, value: jest.fn(() => null),
    });
    const original = imageFile("front.png", "image/png");

    expect(await toWebp(original)).toBe(original);
  });

  it("keeps the original when the encoder answers with another format", async () => {
    encoder.mockImplementation((callback: BlobCallback) =>
      callback(new Blob([new Uint8Array([1])], { type: "image/png" })));
    const original = imageFile("front.jpg", "image/jpeg");

    expect(await toWebp(original)).toBe(original);
  });

  it("keeps the original when the picture cannot be decoded", async () => {
    (globalThis.createImageBitmap as jest.Mock).mockRejectedValue(new Error("no decoder"));
    const original = imageFile("front.heic", "image/heic");

    expect(await toWebp(original)).toBe(original);
  });

  it("caps a camera-sized photograph at the gallery's maximum edge", async () => {
    (globalThis.createImageBitmap as jest.Mock).mockResolvedValue({ width: 6000, height: 4000, close: jest.fn() });

    const converted = await toWebp(imageFile("front.jpg", "image/jpeg"));

    expect(converted.type).toBe(WEBP_MIME);
    expect(lastCanvas?.width).toBe(4000);
    expect(lastCanvas?.height).toBe(2667);
  });

  it("shrinks an avatar to the size the profile picture is drawn at", async () => {
    const converted = await toWebp(imageFile("portrait.png", "image/png"), 0.82, 512);

    expect(converted.type).toBe(WEBP_MIME);
    expect(lastCanvas?.width).toBe(512);
    expect(lastCanvas?.height).toBe(341);
  });

  it("converts a batch in order", async () => {
    const files = [imageFile("one.jpg", "image/jpeg"), imageFile("two.png", "image/png")];

    const converted = await toWebpFiles(files);

    expect(converted.map((file) => file.name)).toEqual(["one.webp", "two.webp"]);
  });

  it("recognises names and types the gallery already stores", () => {
    expect(isWebp(imageFile("photo.WEBP", ""))).toBe(true);
    expect(webpName("mirror.final.jpeg")).toBe("mirror.final.webp");
    expect(webpName("photo")).toBe("photo.webp");
  });
});
