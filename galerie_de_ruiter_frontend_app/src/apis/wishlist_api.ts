import type Antique from "@/models/antiques/Antique";
import { csrfHeaders } from "@/apis/client";
import { axiosInstance, backendBaseURL } from "./backendClient";

/** One visitor who marked a piece, as the gallery's interest screen shows them. */
export type InterestedPerson = {
  userId: string;
  name: string;
  email?: string | null;
  addedAt: string;
};

export type InterestStatus = "NEW" | "IN_PROGRESS" | "SOLD";

/** The pieces at least one visitor marked, with the people to contact. */
export type AdminInterestGroup = {
  antiqueId: string;
  title: string;
  artist?: string | null;
  category?: string | null;
  imageUrl?: string | null;
  sold: boolean;
  status: InterestStatus;
  people: InterestedPerson[];
};

/** The signed-in visitor's interest list. The API reads the account from the request token. */
export async function getWishlist(): Promise<Antique[]> {
  const response = await axiosInstance.get<Antique[]>(`${backendBaseURL}/api/wishlist`);
  return Array.isArray(response.data) ? response.data : [];
}

export async function addWishlistItem(antiqueId: string): Promise<void> {
  await axiosInstance.post(`${backendBaseURL}/api/wishlist/${antiqueId}`, undefined, {
    headers: await csrfHeaders(),
  });
}

export async function removeWishlistItem(antiqueId: string): Promise<void> {
  await axiosInstance.delete(`${backendBaseURL}/api/wishlist/${antiqueId}`, {
    headers: await csrfHeaders(),
  });
}

/** Admin only: what visitors want, grouped by piece. */
export async function getAdminInterests(): Promise<AdminInterestGroup[]> {
  const response = await axiosInstance.get<AdminInterestGroup[]>(`${backendBaseURL}/api/admin/interests`);
  return Array.isArray(response.data) ? response.data : [];
}

/** Admin only: move a piece's interest follow-up between new and in progress. */
export async function setInterestStatus(
  antiqueId: string,
  status: Exclude<InterestStatus, "SOLD">,
): Promise<void> {
  await axiosInstance.put(`${backendBaseURL}/api/admin/interests/${antiqueId}/status`, { status }, {
    headers: { ...(await csrfHeaders()), "Content-Type": "application/json" },
  });
}
