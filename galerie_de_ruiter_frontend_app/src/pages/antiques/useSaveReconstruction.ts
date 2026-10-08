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
  const savingJob = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (!antique || job?.status !== "completed" || !job.model_url
      || savedJob.current === job.job_id || savingJob.current === job.job_id || !images) return;
    const views = positions.flatMap((position) => images[position] ? [{ position, image_data: images[position]! }] : []);
    if (views.length !== positions.length) return;
    savingJob.current = job.job_id;
    saveAntiqueReconstruction(antique.id, views, job.model_url).then(() => {
      savedJob.current = job.job_id;
      setMessage?.("sixViewsSaved"); publishContentUpdate("antiques");
    }).catch((error: unknown) => {
      console.error("Could not save the completed reconstruction to the antique.", error);
      setMessage?.("sixViewsNotSaved");
    }).finally(() => {
      if (savingJob.current === job.job_id) savingJob.current = undefined;
    });
  }, [antique, images, job, setMessage]);
}
