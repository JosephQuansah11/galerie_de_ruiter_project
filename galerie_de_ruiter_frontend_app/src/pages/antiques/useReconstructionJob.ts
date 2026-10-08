import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { createReconstructionJob, getReconstructionJob, type ReconstructionJob } from "@/apis/reconstruction_api";
import type { Position } from "./detailTypes";
import { positions } from "./detailTypes";

export function useReconstructionJob(antiqueId: string, images: Partial<Record<Position, File>>) {
  const [job, setJob] = useState<ReconstructionJob>();
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  useEffect(() => {
    if (!job || !["queued", "running"].includes(job.status)) return;
    const timer = window.setInterval(() => getReconstructionJob(job.job_id).then((updated) => {
      setJob(updated);
      if (updated.status === "processing_disabled") setMessage("reconstructionDisabled");
      else if (updated.status === "failed") setMessage("reconstructionFailed");
      else if (updated.status === "completed") setMessage("reconstructionCompleted");
    }).catch((error: unknown) => {
      console.error("Could not refresh reconstruction status.", error);
      setMessage("reconstructionStatusUnavailable");
    }), 3000);
    return () => window.clearInterval(timer);
  }, [job]);
  const submit = useCallback(async () => {
    if (submitting || !positions.every((position) => images[position])) return;
    setSubmitting(true);
    setJob(undefined);
    setMessage("uploadingSixViews");
    try {
      const result = await createReconstructionJob(antiqueId, positions.map((position) => ({ position, file: images[position]! })));
      setJob(result);
      setMessage(result.status === "processing_disabled" ? "reconstructionDisabled" : "reconstructionStarted");
    } catch (error) {
      console.error("Could not start reconstruction.", error);
      if (axios.isAxiosError(error) && error.response?.status === 413) {
        setMessage("reconstructionImageTooLarge");
      } else if (axios.isAxiosError(error) && error.response?.status === 503) {
        setMessage("reconstructionDisabled");
      } else if (axios.isAxiosError(error) && [400, 415, 422].includes(error.response?.status ?? 0)) {
        setMessage("reconstructionImageInvalid");
      } else if (axios.isAxiosError(error) && !error.response) {
        setMessage("reconstructionConnectionFailed");
      } else {
        setMessage("reconstructionFailed");
      }
    } finally {
      setSubmitting(false);
    }
  }, [antiqueId, images, submitting]);
  return { job, setJob, message, setMessage, submit, submitting };
}
