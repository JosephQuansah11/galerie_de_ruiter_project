import { useEffect, useState } from "react";
import { Alert, Spinner } from "react-bootstrap";
import { BarChart3 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { getGalleryStats } from "@/apis/backend_api";
import type { GalleryStats } from "@/apis/backend_api";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { usePageMeta } from "@/hooks/usePageMeta";
import { CategoryBreakdown } from "./dashboard/CategoryBreakdown";
import { ViewsChart } from "./dashboard/ViewsChart";

/** The windows the gallery can look at. A week, a month, a quarter. */
const RANGES = [7, 30, 90];

/**
 * What the gallery sold, what is still on offer and how much interest the collection drew, all
 * from the site's own rows. The endpoint behind it is administrators only, and so is this page.
 */
export default function DashboardPage() {
  const { t } = useTranslation();
  const { locale } = useLanguage();
  const auth = useAuth();
  const [days, setDays] = useState(RANGES[1]);
  const [stats, setStats] = useState<GalleryStats>();
  const [error, setError] = useState(false);

  // The gallery's own numbers are nobody else's business, so the page stays out of the index.
  usePageMeta({ title: t("metaDashboardTitle"), canonicalPath: "/admin/dashboard", noindex: true });

  useEffect(() => {
    if (!auth.isAdmin) return;
    let active = true;
    setError(false);
    getGalleryStats(days)
      .then((value) => { if (active) setStats(value); })
      .catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, [auth.isAdmin, days]);

  if (!auth.isAdmin) return <Alert variant="warning">{t("adminAccessRequired")}</Alert>;

  return <section className="admin-page dashboard-page">
    <div className="shopping-heading"><div><span className="catalogue-artist">{t("administration")}</span>
      <h1>{t("dashboardHeading")}</h1></div><BarChart3 size={32} /></div>
    <p className="admin-intro">{t("dashboardIntro")}</p>

    <div className="dashboard-range" role="group" aria-label={t("dashboardRangeLabel")}>
      {RANGES.map((value) => <button key={value} type="button"
        className={`btn ${value === days ? "btn-dark" : "btn-outline-dark"}`}
        aria-pressed={value === days} onClick={() => setDays(value)}>
        {t("dashboardRangeDays", { count: value })}
      </button>)}
    </div>

    {error && <Alert variant="danger">{t("statsLoadError")}</Alert>}
    {!error && !stats && <div className="catalogue-state"><Spinner animation="border" size="sm" /> {t("loadingStats")}</div>}
    {stats && <>
      <div className="dashboard-cards">
        <StatCard label={t("statAntiques")} value={stats.totals.antiques} />
        <StatCard label={t("sold")} value={stats.totals.sold} />
        <StatCard label={t("statAvailable")} value={stats.totals.available} />
        <StatCard label={t("statViews")} value={stats.totals.views} />
        <StatCard label={t("statLikes")} value={stats.totals.likes} />
      </div>
      <section className="dashboard-panel">
        <h2>{t("viewsOverTime")}</h2>
        <ViewsChart series={stats.viewsPerDay} label={t("viewsOverTime")} emptyLabel={t("statsNoViewsYet")} locale={locale} />
      </section>
      <section className="dashboard-panel">
        <h2>{t("soldOverTime")}</h2>
        <ViewsChart series={stats.soldPerDay} label={t("soldOverTime")} emptyLabel={t("soldSinceNote")} locale={locale} />
      </section>
      <CategoryBreakdown rows={stats.categories} />
    </>}
  </section>;
}

function StatCard({ label, value }: { label: string; value: number }) {
  return <div className="dashboard-card"><strong>{value}</strong><span>{label}</span></div>;
}
