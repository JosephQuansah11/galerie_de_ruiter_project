import { useEffect, useRef, useState } from "react";
import { Form, Badge } from "react-bootstrap";
import { Search, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import type Antique from "@/models/antiques/Antique";
import type { Category } from "@/models/antiques/Antique";
import { JumpToBottom } from "@/components/JumpToBottom";
import { CollectionFilter } from "./CollectionFilter";
import { AntiqueList } from "./AntiqueList";
import { CataloguePaging } from "./CataloguePaging";
import { CatalogueSignInHint } from "./CatalogueSignInHint";
import { CatalogueStatus } from "./CatalogueStatus";

/** How many pieces a page shows until the visitor chooses otherwise. */
const DEFAULT_PAGE_SIZE = 12;

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
  /** Whether the visitor has an account: a visitor sees the first page of the list and no more. */
  signedIn: boolean;
  /**
   * True while the account check is still on its way. Neither the paging controls nor the
   * invitation belongs on screen then: the answer decides which of the two it is, and showing the
   * wrong one for a moment is showing a signed-in visitor a restriction that does not apply to
   * them.
   */
  checkingSession: boolean;
};

export function CataloguePage(props: Props) {
  const { t } = useTranslation();
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [page, setPage] = useState(1);
  const listRef = useRef<HTMLDivElement>(null);
  const hasQuery = props.query.length > 0;
  // A visitor without an account reads the first page of the list and nothing deeper, so the page
  // size is the default one and the page is the first, whatever the controls would have said.
  const effectivePageSize = props.signedIn ? pageSize : DEFAULT_PAGE_SIZE;
  // A new search, category or page size starts again from the first page.
  useEffect(() => { setPage(1); }, [props.query, props.category, pageSize]);
  const pageCount = effectivePageSize === 0 ? 1 : Math.max(1, Math.ceil(props.filteredAntiques.length / effectivePageSize));
  const currentPage = props.signedIn ? Math.min(page, pageCount) : 1;
  const visible = effectivePageSize === 0
    ? props.filteredAntiques
    : props.filteredAntiques.slice((currentPage - 1) * effectivePageSize, currentPage * effectivePageSize);
  return <section className="catalogue-page">
    <CatalogueHeading count={props.antiques.length} shown={props.filteredAntiques.length} query={props.query} />
    <div className="catalogue-controls">
      <Form className="catalogue-search" role="search" onSubmit={(event) => event.preventDefault()}>
        <span className="catalogue-search-icon" aria-hidden="true"><Search size={18} /></span>
        <Form.Control id="catalogue-search" aria-label={t("searchAntiques")} value={props.query} onChange={(event) => props.onQueryChange(event.target.value)} placeholder={t("searchPlaceholder")} />
        {hasQuery && <button type="button" className="catalogue-search-clear" aria-label={t("clearSearch")}
          // Clearing the search and the category together is what "clear everything" means; leaving
          // the category behind is how a visitor ends up looking at four pieces after clearing
          // everything, and concluding the results did not clear.
          onClick={() => { props.onQueryChange(""); props.setCategory(t("allPieces")); }}>
          <X size={16} aria-hidden="true" />
        </button>}
        <button type="submit" className="catalogue-search-submit">
          <Search size={16} aria-hidden="true" /><span>{t("search")}</span>
        </button>
      </Form>
      <CollectionFilter categories={props.categories} category={props.category} onSelect={props.setCategory} />
    </div>
    <CatalogueStatus loading={props.loading} error={props.error} categoriesLoading={props.categoriesLoading} categoriesError={props.categoriesError} empty={!props.filteredAntiques.length} hasQuery={Boolean(props.query)} />
    {!props.loading && !props.error && <>
      <AntiqueList antiques={visible} listRef={listRef} />
      {visible.length > 0 && <JumpToBottom itemCount={visible.length} targetRef={listRef} />}
      {props.filteredAntiques.length > 0 && !props.checkingSession && (props.signedIn
        ? <CataloguePaging pageSize={pageSize} page={currentPage} pageCount={pageCount}
          onPageSize={setPageSize} onPage={setPage} />
        // The invitation belongs there only when there is something past the first page.
        : props.filteredAntiques.length > DEFAULT_PAGE_SIZE && <CatalogueSignInHint />)}
    </>}
  </section>;
}

/**
 * The heading answers the question a search asks: how many pieces match what I typed, out of how
 * many there are. Before this it always reported the whole collection, so a search that found four
 * pieces still said "66 pieces listed" above them, which looks like a filter that did not apply.
 */
function CatalogueHeading({ count, shown, query }: { count: number; shown: number; query: string }) {
  const { t } = useTranslation();
  const searching = query.trim().length > 0;
  return <div className="catalogue-heading"><div>
    <Badge bg="dark" className="catalogue-kicker">{searching ? t("search", { defaultValue: "Search" }) : t("collection")}</Badge>
    <h1>{searching ? t("searchResultsTitle", { defaultValue: "Results for “{{query}}”", query: query.trim() }) : t("collectionTitle")}</h1>
    <p>{searching
      ? t("searchResultsIntro", { defaultValue: "{{shown}} of {{total}} pieces match.", shown, total: count })
      : t("collectionIntro")}</p>
  </div><div className="catalogue-count">
    <strong>{searching ? shown : count}</strong>
    <span>{searching ? t("resultsFound", { defaultValue: "results" }) : t("piecesListed")}</span>
  </div></div>;
}
