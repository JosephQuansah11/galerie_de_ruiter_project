import { useEffect, useRef } from "react";
import { saveAntiqueReconstruction } from "@/apis/backend_api";
import type Antique from "@/models/antiques/Antique";
import type { ReconstructionJob } from "@/apis/reconstruction_api";
import type { Position } from "./detailTypes";
import { positions } from "./detailTypes";
import { publishContentUpdate } from "@/services/contentUpdates";

export function useSaveReconstruction(antique?: Antique, images?: Partial<Record<Position, File>>,
  job?: ReconstructionJob, setMessage?: (message: string) => void) {
  const savedJob = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (!antique || job?.status !== "completed" || !job.model_url || savedJob.current === job.job_id || !images) return;
    const views = positions.flatMap((position) => images[position] ? [{ position, image_data: images[position]! }] : []);
    if (views.length !== positions.length) return;
    savedJob.current = job.job_id;
    saveAntiqueReconstruction(antique.id, views, job.model_url).then(() => {
      setMessage?.("sixViewsSaved"); publishContentUpdate("antiques");
    }).catch(() => setMessage?.("sixViewsNotSaved"));
  }, [antique, images, job, setMessage]);
}
