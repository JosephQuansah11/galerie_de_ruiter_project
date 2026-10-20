/**
 * Turns a picked photograph into the WebP the gallery stores.
 *
 * <p>The browser is the best place to do this: it already has the picture decoded, it can read the
 * formats the camera writes, and the admin's connection only has to carry the smaller WebP instead
 * of a five-megabyte JPEG. Nothing here is allowed to stop an upload - a format the browser cannot
 * draw, a canvas that is not available, an encoder that says no - the original file is returned and
 * the API's own conversion is the safety net.</p>
 *
 * <p>AVIF is not produced here on purpose: browsers can draw it, but their canvas encoders only
 * write WebP (and PNG/JPEG). WebP is therefore the one format this app can guarantee on every
 * browser the gallery supports.</p>
 */

export const WEBP_MIME = "image/webp";
/** The same quality the API uses, so a picture looks the same whichever side converted it. */
export const WEBP_QUALITY = 0.82;
/**
 * The longest side the gallery stores. A camera file can be fifty megapixels; the largest copy a
 * page draws is 1600 pixels, so 4000 keeps detail for zooming while cutting the upload and the
 * server's decoding cost by a wide margin.
 */
export const MAX_IMAGE_EDGE = 4000;

/** Formats a browser can reasonably decode and that are worth re-encoding. */
const CONVERTIBLE_TYPES = new Set([
  "image/jpeg", "image/jpg", "image/png", "image/avif", "image/bmp",
  "image/tiff", "image/heic", "image/heif", "image/webp",
]);

export function isWebp(file: File): boolean {
  return file.type === WEBP_MIME || /\.webp$/i.test(file.name);
}

/** Whether it is worth asking the canvas to re-encode this file. */
export function isConvertible(file: File): boolean {
  if (isWebp(file)) return false;
  const type = file.type.toLowerCase();
  if (CONVERTIBLE_TYPES.has(type)) return true;
  // A picker can report an empty or unusual type; an image the browser can decode is still worth a
  // try, but an animated GIF or an SVG would lose what makes it useful, so those are left alone.
  return type.startsWith("image/") && !type.includes("svg") && !type.includes("gif");
}

/** The file's name with a `.webp` extension, which is what the API and the bucket expect. */
export function webpName(name: string): string {
  const base = name.replace(/\.[^./\\]+$/, "").trim();
  return `${base || "photo"}.webp`;
}

type DecodedImage = { width: number; height: number; source: CanvasImageSource; release: () => void };

function loadWithElement(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    // A decode that never settles must not hold an upload open forever.
    const timer = setTimeout(() => reject(new Error("The image took too long to decode.")), 10000);
    image.onload = () => { clearTimeout(timer); resolve(image); };
    image.onerror = () => { clearTimeout(timer); reject(new Error("The image could not be decoded.")); };
    image.src = url;
  });
}

async function decode(file: File): Promise<DecodedImage | undefined> {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file);
      return {
        width: bitmap.width,
        height: bitmap.height,
        source: bitmap,
        release: () => bitmap.close?.(),
      };
    } catch {
      // The browser's own decoder said no. An <img> uses the same decoders and would fail too,
      // so the original is uploaded instead of waiting on an element that may never load.
      return undefined;
    }
  }
  // Older browsers without createImageBitmap can still decode through an element.
  if (typeof document === "undefined" || typeof URL.createObjectURL !== "function") return undefined;
  const url = URL.createObjectURL(file);
  try {
    const image = await loadWithElement(url);
    return {
      width: image.naturalWidth,
      height: image.naturalHeight,
      source: image,
      release: () => URL.revokeObjectURL(url),
    };
  } catch {
    URL.revokeObjectURL(url);
    return undefined;
  }
}

function encode(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    if (typeof canvas.toBlob !== "function") {
      resolve(null);
      return;
    }
    try {
      canvas.toBlob((blob) => resolve(blob), WEBP_MIME, quality);
    } catch {
      resolve(null);
    }
  });
}

/**
 * The same photograph as WebP, or the original file when it is already WebP, when the browser
 * cannot decode it, or when the encoder refuses. The returned file keeps its original name and
 * last-modified time so nothing downstream treats it as a different photograph.
 */
export async function toWebp(
  file: File,
  quality = WEBP_QUALITY,
  maxEdge = MAX_IMAGE_EDGE,
): Promise<File> {
  if (!isConvertible(file)) return file;
  if (typeof document === "undefined") return file;
  try {
    const decoded = await decode(file);
    if (!decoded || decoded.width === 0 || decoded.height === 0) return file;
    try {
      const canvas = document.createElement("canvas");
      const scale = Math.min(1, maxEdge / Math.max(decoded.width, decoded.height));
      canvas.width = Math.max(1, Math.round(decoded.width * scale));
      canvas.height = Math.max(1, Math.round(decoded.height * scale));
      const context = canvas.getContext("2d");
      if (!context) return file;
      context.drawImage(decoded.source, 0, 0, canvas.width, canvas.height);
      const blob = await encode(canvas, quality);
      // A browser that has no WebP encoder silently answers with PNG instead.
      if (!blob || blob.type !== WEBP_MIME) return file;
      return new File([blob], webpName(file.name), { type: WEBP_MIME, lastModified: file.lastModified });
    } finally {
      decoded.release();
    }
  } catch {
    return file;
  }
}

/** Converts a batch one at a time, so a large import does not decode every photograph at once. */
export async function toWebpFiles(
  files: File[],
  quality = WEBP_QUALITY,
  maxEdge = MAX_IMAGE_EDGE,
): Promise<File[]> {
  const converted: File[] = [];
  for (const file of files) converted.push(await toWebp(file, quality, maxEdge));
  return converted;
}
