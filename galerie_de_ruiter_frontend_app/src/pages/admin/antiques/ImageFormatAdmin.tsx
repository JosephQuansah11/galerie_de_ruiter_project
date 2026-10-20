import { useEffect, useState } from "react";
import { Alert, Badge, Card, Modal, Spinner } from "react-bootstrap";
import { Image as ImageIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { convertImagesToWebp, getImageFormatStatus, type ImageFormatReport, type ImageFormatStatus } from "@/apis/backend_api";
import { describeApiError } from "@/apis/apiError";
import { Button } from "@/components/ReactButton";

/** A byte count the curator can read, for the saving the conversion reports. */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 kB";
  const units = ["B", "kB", "MB", "GB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  const rounded = new Intl.NumberFormat(undefined, { maximumFractionDigits: value < 10 ? 1 : 0 }).format(value);
  return `${rounded} ${units[unit]}`;
}

/**
 * The switch that rewrites the catalogue's older JPEG photographs as WebP.
 *
 * <p>It reports before it acts: how many photographs are already WebP, how many are left, and
 * whether this API can encode WebP at all. The conversion itself runs on the server, one picture
 * at a time, and the admin confirms it because the original file is replaced.</p>
 */
export function ImageFormatAdmin() {
  const { t } = useTranslation();
  const [status, setStatus] = useState<ImageFormatStatus>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [confirming, setConfirming] = useState(false);
  const [converting, setConverting] = useState(false);
  const [report, setReport] = useState<ImageFormatReport>();

  const refresh = () => {
    setLoading(true);
    getImageFormatStatus()
      .then((value) => { setStatus(value); setError(undefined); })
      .catch((thrown) => setError(describeApiError(thrown, t("imageFormatFailed"))))
      .finally(() => setLoading(false));
  };

  useEffect(refresh, []);

  const convert = async () => {
    setConverting(true);
    setError(undefined);
    setReport(undefined);
    // The API converts one bounded batch per request, so no single request outlives the host's
    // timeout. Keep asking until it reports that nothing is left.
    const progress: ImageFormatReport = {
      dryRun: false, total: 0, webp: 0, candidates: status?.candidates ?? 0,
      converted: 0, bytesBefore: 0, bytesAfter: 0, failed: [],
    };
    try {
      let remaining = progress.candidates;
      for (let round = 0; round < 200 && remaining > 0; round += 1) {
        const batch = await convertImagesToWebp(true, 25);
        progress.converted += batch.converted;
        progress.bytesBefore += batch.bytesBefore;
        progress.bytesAfter += batch.bytesAfter;
        progress.failed.push(...batch.failed);
        progress.total = batch.total;
        progress.webp = batch.webp;
        progress.candidates = batch.candidates;
        remaining = batch.candidates;
        // A batch that changed nothing would repeat forever - for example when the encoder cannot
        // read what is left. The result then reports those pictures as failures.
        if (batch.converted === 0) break;
      }
      setReport(progress);
      setConfirming(false);
      refresh();
    } catch (thrown) {
      setError(describeApiError(thrown, t("imageFormatFailed")));
    } finally {
      setConverting(false);
    }
  };

  return <Card className="image-format-admin"><Card.Body>
    <div className="image-format-admin-heading">
      <div>
        <h2>{t("imageFormatTitle")}</h2>
        <p className="image-format-admin-intro">{t("imageFormatIntro")}</p>
      </div>
      {status && <Badge bg={status.webpEncoder ? "success" : "warning"}>
        {status.webpEncoder ? "WebP" : t("imageFormatNoEncoderBadge")}
      </Badge>}
    </div>
    {loading && <p className="image-format-admin-status"><Spinner animation="border" size="sm" /> {t("imageFormatLoading")}</p>}
    {error && <Alert variant="danger">{error}</Alert>}
    {status && <>
      <p className="image-format-admin-status">
        {t("imageFormatStatus", { webp: status.webp, total: status.total })}
      </p>
      {status.candidates === 0
        ? <Alert variant="success" className="mb-0">{t("imageFormatAllDone")}</Alert>
        : <div className="image-format-admin-actions">
          <span>{t("imageFormatCandidates", { count: status.candidates })}</span>
          <Button className="btn btn-outline-dark" type="button" disabled={!status.webpEncoder || converting}
            onClick={() => setConfirming(true)}>
            <ImageIcon size={16} /> {t("imageFormatConvert")}
          </Button>
        </div>}
      {!status.webpEncoder && <Alert variant="warning" className="mt-3 mb-0">{t("imageFormatNoEncoder")}</Alert>}
      {report && <Alert variant={report.failed.length > 0 ? "warning" : "success"} className="mt-3 mb-0">
        {report.failed.length > 0
          ? t("imageFormatResultMixed", { converted: report.converted, failed: report.failed.length })
          : t("imageFormatResult", {
            count: report.converted,
            saved: formatBytes(report.bytesBefore - report.bytesAfter),
          })}
      </Alert>}
    </>}

    <Modal show={confirming} onHide={() => !converting && setConfirming(false)} centered>
      <Modal.Header closeButton={!converting}>
        <Modal.Title>{t("imageFormatConfirmTitle")}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>{t("imageFormatConfirmBody", { count: status?.candidates ?? 0 })}</p>
        {converting && <p className="image-format-admin-status" role="status">
          <Spinner animation="border" size="sm" /> {t("imageFormatConverting")}
        </p>}
      </Modal.Body>
      <Modal.Footer>
        <Button className="btn btn-outline-secondary" type="button" disabled={converting}
          onClick={() => setConfirming(false)}>
          {t("cancel")}
        </Button>
        <Button className="btn btn-primary" type="button" disabled={converting} onClick={() => void convert()}>
          {converting ? <Spinner animation="border" size="sm" /> : <ImageIcon size={16} />}
          {t("imageFormatConvert")}
        </Button>
      </Modal.Footer>
    </Modal>
    <p className="image-format-admin-hint">{t("imageFormatHint")}</p>
  </Card.Body></Card>;
}
