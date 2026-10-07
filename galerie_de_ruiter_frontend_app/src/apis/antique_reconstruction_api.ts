import type Antique from "@/models/antiques/Antique";
import { csrfHeaders } from "@/apis/client";
import { axiosInstance, backendBaseURL } from "./backendClient";

function fileToBase64(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string" || !reader.result.split(",")[1]) return reject(new Error("Invalid base64 image data"));
      resolve(reader.result.split(",")[1]);
    };
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read image"));
    reader.readAsDataURL(file);
  });
}

export async function saveAntiqueReconstruction(id: string, views: { position: string; image_data: File }[], modelUrl?: string | null): Promise<Antique> {
  const reconstructionViews = await Promise.all(views.map(async ({ position, image_data }) => ({
    position, imageData: await fileToBase64(image_data), contentType: image_data.type,
  })));
  const response = await axiosInstance.put<Antique>(`${backendBaseURL}/api/antiques/${id}/reconstruction`, {
    views: reconstructionViews, modelUrl: modelUrl ?? null,
  }, { headers: await csrfHeaders() });
  return response.data;
}
export async function getAntiqueReconstructionImages(id: string): Promise<{ position: string; imageData: string; contentType: string }[]> {
  const response = await axiosInstance.get<{ position: string; imageData: string; contentType: string }[]>(`${backendBaseURL}/api/antiques/${id}/reconstruction`);
  return response.data;
}
