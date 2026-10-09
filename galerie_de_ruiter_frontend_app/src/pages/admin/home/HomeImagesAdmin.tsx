import { useRef, useState, type ChangeEvent } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Form, Spinner } from "react-bootstrap";
import { ImagePlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ReactButton";
import { resolveHomeImageUrl } from "@/apis/home_api";
import { useHomeImagesAdmin } from "./useHomeImagesAdmin";

/** Upload, caption and remove the photographs of the welcome page slider. */
export function HomeImagesAdmin() {
  const { t } = useTranslation();
  const { images, busy, error, add, remove } = useHomeImagesAdmin();
  const input = useRef<HTMLInputElement>(null);
  const [caption, setCaption] = useState("");

  const choose = async (event: ChangeEvent<HTMLInputElement>) => {
    const image = event.target.files?.[0];
    event.target.value = "";
    if (!image) return;
    await add(image, caption);
    setCaption("");
  };

  return <section className="home-images-admin">
    <h3>{t("welcomeImages")}</h3>
    <p className="admin-intro">{t("welcomeImagesHint")}</p>
    {error && <Alert variant="danger">{error}</Alert>}
    <div className="home-images-admin-row">
      <Form.Control value={caption} onChange={(event) => setCaption(event.target.value)}
        placeholder={t("imageCaption")} aria-label={t("imageCaption")} />
      <input ref={input} hidden type="file" accept="image/png,image/jpeg,image/webp" onChange={choose} />
      <Button className="btn btn-outline-dark" type="button" disabled={busy} onClick={() => input.current?.click()}
        text={<>{busy ? <Spinner size="sm" /> : <ImagePlus size={16} />}{t("addWelcomeImage")}</>} />
    </div>
    {images.length > 0 && <ul className="home-images-list">
      {images.map((image) => <li key={image.id}>
        <img src={resolveHomeImageUrl(image.url)} alt={image.caption?.trim() || t("welcomeImages")} />
        <span>{image.caption?.trim() || ""}</span>
        <Button className="btn btn-outline-danger btn-sm" type="button" disabled={busy}
          onClick={() => void remove(image.id)} aria-label={t("removeWelcomeImage")} text={<Trash2 size={15} />} />
      </li>)}
    </ul>}
  </section>;
}
