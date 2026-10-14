export type StoreLocation = {
  id: string;
  address: string;
  openingHours: string;
  latitude: number;
  longitude: number;
};
export type AboutContent = { content: string };
/** A photograph on a piece; the editor uses `id` to order and remove it. */
export type AntiqueImage = { id: string; url: string };
/** A photograph uploaded for the About page; the editor inserts `url` into the story. */
export type AboutImage = { id: string; url: string };
