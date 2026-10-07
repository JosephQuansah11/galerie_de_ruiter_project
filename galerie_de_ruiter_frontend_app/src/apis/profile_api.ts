import axios from "axios";
import axiosInstance from "@/apis/authPromise";
import { csrfHeaders } from "@/apis/client";

const backendUrl =
  import.meta.env.VITE_JAVA_BACKEND_URL ?? "http://localhost:8080";

export async function uploadProfileAvatar(image: File): Promise<void> {
  const form = new FormData();
  form.append("image", image);
  await axiosInstance.put(`${backendUrl}/api/me/avatar`, form, {
    headers: { ...(await csrfHeaders()), "Content-Type": undefined },
  });
}

export async function loadProfileAvatar(): Promise<string | undefined> {
  try {
    const { data } = await axiosInstance.get<Blob>(
      `${backendUrl}/api/me/avatar`,
      { responseType: "blob" },
    );
    return URL.createObjectURL(data);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return undefined;
    }
    throw error;
  }
}
