import { useTranslation } from "react-i18next";
import type { GalleryStatsCategory } from "@/apis/statsTypes";

/**
 * What is sold and what is still on offer, per collection and subcategory. A subcategory is
 * indented under the collection it belongs to and carries a bar of its own numbers, so the
 * gallery can see at a glance where the sold pieces are.
 */
export function CategoryBreakdown({ rows }: { rows: GalleryStatsCategory[] }) {
  const { t } = useTranslation();
  if (rows.length === 0) return <p className="dashboard-chart-empty">{t("statsNoCategoriesYet")}</p>;
  return <table className="dashboard-table">
    <caption>{t("categoryBreakdown")}</caption>
    <thead>
      <tr>
        <th scope="col">{t("statCollection")}</th>
        <th scope="col">{t("statTotal")}</th>
        <th scope="col">{t("sold")}</th>
        <th scope="col">{t("statAvailable")}</th>
        <th scope="col">{t("statViews")}</th>
      </tr>
    </thead>
    <tbody>
      {rows.map((row) => <tr key={row.id ?? "none"}>
        <th scope="row">
          {row.parentName && <span className="dashboard-table-parent">{row.parentName} /</span>}
          {row.name ?? t("noCategory")}
        </th>
        <td>{row.antiques}</td>
        <td>{row.sold}</td>
        <td>{row.available}</td>
        <td>
          {row.views}
          <span className="dashboard-table-bar" aria-hidden="true">
            <span style={{ width: `${share(row.views, rows)}%` }} />
          </span>
        </td>
      </tr>)}
    </tbody>
  </table>;
}

/** The widest bar in the table is the most-viewed row, so the bars compare with each other. */
function share(views: number, rows: GalleryStatsCategory[]): number {
  const peak = Math.max(1, ...rows.map((row) => row.views));
  return Math.round((views / peak) * 100);
}
