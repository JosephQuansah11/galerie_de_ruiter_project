import axios from "axios";

const reconstructionBaseUrl =
  import.meta.env.VITE_RECONSTRUCTION_API_URL ?? "http://localhost:8000";
const reconstructionClient = axios.create({
  baseURL: reconstructionBaseUrl,
  timeout: 30000,
  withCredentials: false,
});

export type { ReconstructionView, ReconstructionJob } from "./reconstructionTypes";
import type { ReconstructionJob } from "./reconstructionTypes";

export async function createReconstructionJob(
  antiqueId: string,
  images: Array<{ position: string; file: File }>,
): Promise<ReconstructionJob> {
  const body = new FormData();
  body.append("antique_id", antiqueId);
  images.forEach(({ position, file }) => {
    body.append("images", file);
    body.append("positions", position);
  });
  const response = await reconstructionClient.post<ReconstructionJob>(
    "/v1/reconstructions",
    body,
  );
  return response.data;
}

export async function getReconstructionJob(
  jobId: string,
): Promise<ReconstructionJob> {
  const response = await reconstructionClient.get<ReconstructionJob>(
    `/v1/reconstructions/${jobId}`,
  );
  return response.data;
}
