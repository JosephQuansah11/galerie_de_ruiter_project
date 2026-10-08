import { Form } from "react-bootstrap";
import { Button } from "@/components/ReactButton";
import type { ReconstructionJob } from "@/apis/reconstruction_api";
import type { Position, Translate } from "./detailTypes";

type Props = { images: Partial<Record<Position, File>>; job?: ReconstructionJob; message: string;
  disabled: boolean; select: (position: Position, file?: File) => void; submit: () => void; t: Translate };
const statusKeys: Record<string, string> = {
  queued: "reconstructionStatusQueued", running: "reconstructionStatusRunning",
  completed: "reconstructionStatusCompleted", failed: "reconstructionStatusFailed",
  processing_disabled: "reconstructionStatusProcessingDisabled",
};
export function ReconstructionPanel({ images, job, message, disabled, select, submit, t }: Props) {
  return <div className="model-admin-panel"><strong>{t("cpuSixView")}</strong><p>{t("sixViewInstructions")}</p>
    {(["front", "back", "left", "right", "top", "bottom"] as Position[]).map((position) =>
      <div className="position-upload" key={position}><Form.Label>{t(`position${position[0].toUpperCase()}${position.slice(1)}`)}</Form.Label>
        <Form.Control type="file" accept="image/jpeg,image/png,image/webp"
          onChange={(event) => select(position, (event.currentTarget as HTMLInputElement).files?.[0])} /></div>)}
    <small>{Object.keys(images).length}/6 {t("viewsSelected")}</small>
    <Button disabled={disabled} onClick={submit}>{t("submitSixViews")}</Button>
    {job && <small>{t("status")}: {t(statusKeys[job.status] ?? job.status, { defaultValue: job.status })} {job.progress}%</small>}
    {job?.error && <small className="reconstruction-error" role="alert">{job.error}</small>}
    {message && <small>{t(message)}</small>}
  </div>;
}
