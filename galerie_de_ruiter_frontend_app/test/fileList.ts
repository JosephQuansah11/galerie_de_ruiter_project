/**
 * Helpers for the image-picker tests.
 *
 * jsdom has no real file picker, so the tests hand the hooks the same shape the browser
 * would: a `FileList`-like object that is array-like and iterable (the code uses
 * `Array.from` on it).
 */

/** Builds an image file for the picker tests. */
export function imageFile(name: string, type = "image/jpeg"): File {
  return new File([new Uint8Array(1)], name, { type });
}

/** A FileList the browser would hand over for the chosen files. */
export function fileListOf(...files: File[]): FileList {
  const list: { length: number; item: (index: number) => File | null; [Symbol.iterator]: () => Iterator<File>; [index: number]: File } = {
    length: files.length,
    item: (index: number) => files[index] ?? null,
    [Symbol.iterator]: () => files[Symbol.iterator](),
  };
  files.forEach((file, index) => { list[index] = file; });
  return list as unknown as FileList;
}
