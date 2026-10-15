/** The gallery's dashboard numbers, as the administrator-only stats endpoint returns them. */
export type GalleryStatsTotals = {
  antiques: number;
  sold: number;
  available: number;
  views: number;
  likes: number;
};

/** One row of the breakdown: a collection, or a subcategory with its parent's name. */
export type GalleryStatsCategory = {
  id: string | null;
  name: string | null;
  parentName: string | null;
  antiques: number;
  sold: number;
  available: number;
  views: number;
};

/** One point of a series: an ISO day and what happened on it. */
export type GalleryStatsDay = { day: string; count: number };

export type GalleryStats = {
  totals: GalleryStatsTotals;
  categories: GalleryStatsCategory[];
  viewsPerDay: GalleryStatsDay[];
  soldPerDay: GalleryStatsDay[];
};
