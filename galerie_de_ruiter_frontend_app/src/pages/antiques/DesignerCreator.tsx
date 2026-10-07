import { Form, Spinner } from "react-bootstrap";
import { Button } from "@/components/ReactButton";
import { Plus } from "lucide-react";
import type { useAntiqueLookups } from "./useAntiqueLookups";
import { useTranslation } from "react-i18next";

type Props = Pick<ReturnType<typeof useAntiqueLookups>, "newArtist" | "setNewArtist" | "creating" | "addArtist">;
export function DesignerCreator({ newArtist, setNewArtist, creating, addArtist }: Props) {
  const { t } = useTranslation();
  const field = (name: keyof typeof newArtist, label: string) => <Form.Control value={newArtist[name]}
    onChange={(event) => setNewArtist((artist) => ({ ...artist, [name]: event.target.value }))} placeholder={t(label)} />;
  return <fieldset className="border rounded p-3 mb-3"><legend className="float-none w-auto px-2 fs-6">{t("addArtist")}</legend>
    <div className="row g-2"><div className="col-md">{field("firstName", "firstName")}</div>
      <div className="col-md">{field("middleName", "middleName")}</div><div className="col-md">{field("lastName", "lastName")}</div>
      <div className="col-md-auto"><Button type="button" disabled={creating || !newArtist.firstName.trim() || !newArtist.lastName.trim()} onClick={addArtist}>
        {creating ? <Spinner size="sm" /> : <Plus size={16} />} {t("addArtist")}</Button></div></div>
  </fieldset>;
}
