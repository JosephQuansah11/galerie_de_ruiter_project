import { Form } from "react-bootstrap";
import { Button } from "@/components/ReactButton";
import { Search } from "lucide-react";
import type { Designer } from "@/models/antiques/Antique";
import { useTranslation } from "react-i18next";

type Props = { query: string; setQuery: (query: string) => void; designers: Designer[]; choose: (designer: Designer) => void };
export function ArtistSearch({ query, setQuery, designers, choose }: Props) {
  const { t } = useTranslation();
  return <Form.Group className="mb-2"><Form.Label>{t("artist")}</Form.Label>
    <div className="position-relative"><Form.Control required value={query} onChange={(event) => setQuery(event.target.value)}
      placeholder={t("searchByArtist")} autoComplete="off" /><Search className="position-absolute top-50 end-0 translate-middle-y me-3 text-muted" size={18} /></div>
    {designers.length > 0 && <div className="list-group mt-1">{designers.map((designer) =>
      <Button className="list-group-item list-group-item-action" type="button" key={designer.id} onClick={() => choose(designer)}>
        {[designer.firstName, designer.middleName, designer.lastName].filter(Boolean).join(" ")}</Button>)}</div>}
  </Form.Group>;
}
