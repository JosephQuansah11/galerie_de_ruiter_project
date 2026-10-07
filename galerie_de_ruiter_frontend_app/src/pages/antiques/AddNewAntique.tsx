import { useCallback } from "react";
import { Card } from "react-bootstrap";
import { LibraryBig } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { Designer } from "@/models/antiques/Antique";
import { AddAntiqueForm } from "./AddAntiqueForm";
import { useNewAntiqueDraft } from "./useNewAntiqueDraft";
import { useAntiqueLookups } from "./useAntiqueLookups";

export default function AddNewAntique() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const draft = useNewAntiqueDraft((id) => navigate(`/antiques/${id}`));
  const chooseArtist = useCallback((designer: Designer) => draft.update("artistId", designer.id), [draft.update]);
  const lookups = useAntiqueLookups(chooseArtist);
  return <div className="admin-form-page add-antique-page"><Card>
    <Card.Header><LibraryBig size={20} /> {t("catalogueEntry")}</Card.Header>
    <Card.Body><div className="add-antique-intro"><span>{t("newObject")}</span>
      <h1>{t("addAnAntique")}</h1><p>{t("addAntiqueIntro")}</p></div>
      <AddAntiqueForm draft={draft} lookups={lookups} selectArtist={lookups.chooseArtist} />
    </Card.Body>
  </Card></div>;
}
