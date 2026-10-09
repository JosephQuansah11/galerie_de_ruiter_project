import { useRef, useState, type ChangeEvent } from "react";
import { Alert, Spinner } from "react-bootstrap";
import { Camera } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ReactButton";
import { useAuth } from "@/context/AuthContext";
import { uploadProfileAvatar } from "@/apis/profile_api";
import { describeApiError } from "@/apis/apiError";

const MAX_BYTES = 5 * 1024 * 1024;
const SUPPORTED_TYPES = ["image/png", "image/jpeg"];

export function ProfileAvatarUpload() {
  const { t } = useTranslation();
  const auth = useAuth();
  const input = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();
  const [confirmation, setConfirmation] = useState<string>();

  const upload = async (event: ChangeEvent<HTMLInputElement>) => {
    const image = event.target.files?.[0];
    event.target.value = "";
    if (!image) return;
    setConfirmation(undefined);
    if (!SUPPORTED_TYPES.includes(image.type)) {
      setError(t("profileImageUnsupported"));
      return;
    }
    if (image.size > MAX_BYTES) {
      setError(t("profileImageTooLarge"));
      return;
    }
    setSaving(true);
    setError(undefined);
    try {
      await uploadProfileAvatar(image);
      await auth.refreshAvatar();
      setConfirmation(t("profileImageUploadSucceeded"));
    } catch (thrown) {
      // Surface the API reason (session, CSRF or size) so a production failure is
      // actionable instead of a generic message.
      setError(describeApiError(thrown, t("profileImageUploadFailed")));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="profile-avatar-upload">
      <input ref={input} hidden type="file" accept="image/png,image/jpeg" onChange={upload} />
      <Button
        type="button"
        className="btn btn-outline-dark"
        disabled={saving}
        onClick={() => input.current?.click()}
        text={<>{saving ? <Spinner size="sm" /> : <Camera size={16} />}{t(saving ? "uploadingProfileImage" : "changeProfileImage")}</>}
      />
      {error && <Alert variant="danger" className="profile-upload-alert">{error}</Alert>}
      {confirmation && <Alert variant="success" className="profile-upload-alert">{confirmation}</Alert>}
    </div>
  );
}
