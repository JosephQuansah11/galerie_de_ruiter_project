export type ReconstructionView = { position: string; url: string };
export type ReconstructionJob = {
  job_id: string;
  antique_id?: string | null;
  status: "queued" | "running" | "completed" | "failed" | "processing_disabled";
  progress: number;
  error?: string | null;
  model_url?: string | null;
  image_urls?: string[];
  image_views?: ReconstructionView[];
  created_at: string;
  updated_at: string;
};
