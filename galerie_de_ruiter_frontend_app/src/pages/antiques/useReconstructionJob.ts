import { useEffect, useState } from "react";
import { createReconstructionJob, getReconstructionJob, type ReconstructionJob } from "@/apis/reconstruction_api";
import type { Position } from "./detailTypes";
import { positions } from "./detailTypes";

export function useReconstructionJob(antiqueId: string, images: Partial<Record<Position, File>>) {
  const [job, setJob] = useState<ReconstructionJob>();
  const [message, setMessage] = useState("");
  useEffect(() => {
    if (!job || !["queued", "running"].includes(job.status)) return;
    const timer = window.setInterval(() => getReconstructionJob(job.job_id).then(setJob)
      .catch((error: unknown) => console.error("Could not refresh reconstruction status.", error)), 3000);
    return () => window.clearInterval(timer);
  }, [job]);
  const submit = async () => {
    if (!positions.every((position) => images[position])) return;
    setMessage("uploadingSixViews");
    try {
      const result = await createReconstructionJob(antiqueId, positions.map((position) => ({ position, file: images[position]! })));
      setJob(result);
      setMessage(result.status === "processing_disabled" ? "reconstructionDisabled" : "reconstructionStarted");
    } catch { setMessage("reconstructionFailed"); }
  };
  return { job, setJob, message, setMessage, submit };
}
