import { useRef, useState, type ChangeEvent } from "react";
import { Alert, Spinner } from "react-bootstrap";
import { Camera } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ReactButton";
import { useAuth } from "@/context/AuthContext";
import { uploadProfileAvatar } from "@/apis/profile_api";

export function ProfileAvatarUpload() {
  const { t } = useTranslation();
  const auth = useAuth();
  const input = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  const upload = async (event: ChangeEvent<HTMLInputElement>) => {
    const image = event.target.files?.[0];
    event.target.value = "";
    if (!image) return;
    if (!["image/png", "image/jpeg"].includes(image.type) || image.size > 5 * 1024 * 1024) {
      setError(true);
      return;
    }
    setSaving(true);
    setError(false);
    try {
      await uploadProfileAvatar(image);
      await auth.refreshAvatar();
    } catch {
      setError(true);
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
      {error && <Alert variant="danger">{t("profileImageUploadFailed")}</Alert>}
    </div>
  );
}
