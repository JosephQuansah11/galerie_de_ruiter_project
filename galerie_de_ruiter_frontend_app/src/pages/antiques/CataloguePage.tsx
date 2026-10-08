import { Form, Badge } from "react-bootstrap";
import { Search, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import type Antique from "@/models/antiques/Antique";
import type { Category } from "@/models/antiques/Antique";
import { CollectionFilter } from "./CollectionFilter";
import { AntiqueGrid } from "./AntiqueGrid";
import { CatalogueStatus } from "./CatalogueStatus";

type Props = {
  antiques: Antique[];
  filteredAntiques: Antique[];
  loading: boolean;
  error: boolean;
  query: string;
  onQueryChange: (query: string) => void;
  categories: Category[];
  categoriesLoading: boolean;
  categoriesError: boolean;
  category: string;
  setCategory: (category: string) => void;
};

export function CataloguePage(props: Props) {
  const { t } = useTranslation();
  const hasQuery = props.query.length > 0;
  return <section className="catalogue-page">
    <CatalogueHeading count={props.antiques.length} />
    <div className="catalogue-controls">
      <Form className="catalogue-search" role="search" onSubmit={(event) => event.preventDefault()}>
        <span className="catalogue-search-icon" aria-hidden="true"><Search size={18} /></span>
        <Form.Control aria-label={t("searchAntiques")} value={props.query} onChange={(event) => props.onQueryChange(event.target.value)} placeholder={t("searchPlaceholder")} />
        {hasQuery && <button type="button" className="catalogue-search-clear" aria-label={t("clearSearch")} onClick={() => props.onQueryChange("")}>
          <X size={16} aria-hidden="true" />
        </button>}
        <button type="submit" className="catalogue-search-submit">
          <Search size={16} aria-hidden="true" /><span>{t("search")}</span>
        </button>
      </Form>
      <CollectionFilter categories={props.categories} category={props.category} onSelect={props.setCategory} />
    </div>
    <CatalogueStatus loading={props.loading} error={props.error} categoriesLoading={props.categoriesLoading} categoriesError={props.categoriesError} empty={!props.filteredAntiques.length} hasQuery={Boolean(props.query)} />
    {!props.loading && !props.error && <AntiqueGrid antiques={props.filteredAntiques} />}
  </section>;
}

function CatalogueHeading({ count }: { count: number }) {
  const { t } = useTranslation();
  return <div className="catalogue-heading"><div><Badge bg="dark" className="catalogue-kicker">{t("collection")}</Badge><h1>{t("collectionTitle")}</h1><p>{t("collectionIntro")}</p></div><div className="catalogue-count"><strong>{count}</strong><span>{t("piecesListed")}</span></div></div>;
}
