import { axiosInstance, backendBaseURL } from "./backendClient";
import type { GalleryStats } from "./statsTypes";

/**
 * The gallery's own numbers for the dashboard: what is sold and still on offer, per collection
 * and subcategory, and the interest in the collection over the last days.
 *
 * The endpoint is administrators only, so this answers with a 403 for anyone else rather than
 * with numbers they may not see. It is deliberately not cached: a dashboard that shows yesterday
 * is worse than no dashboard.
 */
export async function getGalleryStats(days: number): Promise<GalleryStats> {
  const response = await axiosInstance.get<GalleryStats>(`${backendBaseURL}/api/admin/stats`, {
    params: { days },
  });
  return response.data;
}
