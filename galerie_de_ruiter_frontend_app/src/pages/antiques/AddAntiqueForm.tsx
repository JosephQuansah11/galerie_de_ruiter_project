import { Alert, Form, Spinner } from "react-bootstrap";
import { Button } from "@/components/ReactButton";
import { Save } from "lucide-react";
import type { Category, Designer } from "@/models/antiques/Antique";
import type { useNewAntiqueDraft } from "./useNewAntiqueDraft";
import type { useAntiqueLookups } from "./useAntiqueLookups";
import { useTranslation } from "react-i18next";
import { ArtistSearch } from "./ArtistSearch";
import { DesignerCreator } from "./DesignerCreator";
import { AntiqueIdentityFields } from "./AntiqueIdentityFields";
import { AntiqueMediaFields } from "./AntiqueMediaFields";
import { AntiqueDescriptionFields } from "./AntiqueDescriptionFields";

type Draft = ReturnType<typeof useNewAntiqueDraft>;
type Lookups = ReturnType<typeof useAntiqueLookups>;
export function AddAntiqueForm({ draft, lookups, selectArtist }: { draft: Draft; lookups: Lookups; selectArtist: (designer: Designer) => void }) {
  const { t } = useTranslation();
  return <>
    {(draft.message || lookups.error) && <Alert variant="danger">{t(draft.message ?? lookups.error!)}</Alert>}
    <Form onSubmit={draft.submit}>
      <ArtistSearch query={lookups.query} setQuery={(value) => { lookups.setQuery(value); draft.update("artistId", ""); }}
        designers={lookups.designers} choose={selectArtist} />
      <DesignerCreator newArtist={lookups.newArtist} setNewArtist={lookups.setNewArtist}
        creating={lookups.creating} addArtist={lookups.addArtist} />
      <AntiqueIdentityFields form={draft.form} update={draft.update} categories={lookups.categories} />
      <AntiqueMediaFields form={draft.form} update={draft.update} fileNames={draft.fileNames} selectImages={draft.selectImages} />
      <AntiqueDescriptionFields form={draft.form} update={draft.update} />
      <Button className="btn btn-outline-secondary" type="submit" disabled={draft.saving}>
        {draft.saving ? <Spinner size="sm" /> : <Save size={16} />} {draft.saving ? t("saving") : t("saveAntique")}
      </Button>
    </Form>
  </>;
}
