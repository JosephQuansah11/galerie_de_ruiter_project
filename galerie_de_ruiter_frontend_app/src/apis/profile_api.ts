import axios from "axios";
import axiosInstance from "@/apis/authPromise";
import { apiBaseUrl } from "@/apis/apiConfig";
import { csrfHeaders } from "@/apis/client";

const avatarUrl = `${apiBaseUrl}/api/me/avatar`;

export async function uploadProfileAvatar(image: File): Promise<void> {
  const form = new FormData();
  form.append("image", image);
  await axiosInstance.put(avatarUrl, form, {
    timeout: 60000,
    // The CSRF token must come from the same origin that receives the upload, and the
    // multipart boundary has to be added by the browser, so the JSON default is cleared.
    headers: { ...(await csrfHeaders(apiBaseUrl)), "Content-Type": undefined },
  });
}

export async function loadProfileAvatar(): Promise<string | undefined> {
  try {
    const { data } = await axiosInstance.get<Blob>(avatarUrl, { responseType: "blob" });
    return URL.createObjectURL(data);
  } catch (error) {
    if (axios.isAxiosError(error) && (error.response?.status === 404 || error.response?.status === 204)) {
      return undefined;
    }
    throw error;
  }
}
