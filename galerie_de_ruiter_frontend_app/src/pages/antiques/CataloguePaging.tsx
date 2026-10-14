import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";

/** The sizes a page of the catalogue can show; `0` means "everything on one page". */
export const CATALOGUE_PAGE_SIZES = [12, 24, 48, 0];

type Props = {
  pageSize: number;
  page: number;
  pageCount: number;
  onPageSize: (size: number) => void;
  onPage: (page: number) => void;
};

/**
 * Lets a visitor choose how many pieces a page shows and step through the pages, so a large
 * collection is browsable instead of one endless list.
 */
export function CataloguePaging({ pageSize, page, pageCount, onPageSize, onPage }: Props) {
  const { t } = useTranslation();
  return <div className="catalogue-paging">
    <label className="catalogue-paging-size">
      <span>{t("itemsPerPage")}</span>
      <select value={pageSize} aria-label={t("itemsPerPage")} onChange={(event) => onPageSize(Number(event.target.value))}>
        {CATALOGUE_PAGE_SIZES.map((size) => <option key={size} value={size}>{size === 0 ? t("allPieces") : size}</option>)}
      </select>
    </label>
    {pageCount > 1 && <div className="catalogue-paging-nav">
      <button type="button" className="catalogue-paging-step" aria-label={t("previousPage")}
        disabled={page <= 1} onClick={() => onPage(page - 1)}>
        <ChevronLeft size={16} aria-hidden="true" />
      </button>
      <span className="catalogue-paging-status">{t("pageOf", { page, pages: pageCount })}</span>
      <button type="button" className="catalogue-paging-step" aria-label={t("nextPage")}
        disabled={page >= pageCount} onClick={() => onPage(page + 1)}>
        <ChevronRight size={16} aria-hidden="true" />
      </button>
    </div>}
  </div>;
}
