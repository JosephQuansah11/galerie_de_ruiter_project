import type { GalleryStatsDay } from "@/apis/statsTypes";

type Props = {
  /** The series, oldest day first. Every day of the window is in it, so gaps are zeroes. */
  series: GalleryStatsDay[];
  label: string;
  emptyLabel: string;
  /** The locale the day labels are written in, which follows the gallery's language. */
  locale: string;
};

const WIDTH = 720;
const HEIGHT = 200;
const PAD = { top: 14, right: 14, bottom: 26, left: 38 };

/**
 * One series over time, drawn as an SVG rather than with a charting library: the dashboard needs
 * a shape, not a toolkit, and this keeps the admin chunk small. The gallery reads it as "how many
 * people looked at the collection on which day", so the busiest day sets the height and every day
 * of the window gets a point.
 */
export function ViewsChart({ series, label, emptyLabel, locale }: Props) {
  const total = series.reduce((sum, point) => sum + point.count, 0);
  if (series.length === 0 || total === 0) {
    return <p className="dashboard-chart-empty">{emptyLabel}</p>;
  }

  const peak = Math.max(...series.map((point) => point.count));
  const step = series.length > 1 ? (WIDTH - PAD.left - PAD.right) / (series.length - 1) : 0;
  const x = (index: number) => PAD.left + index * step;
  const y = (count: number) => PAD.top + (1 - count / peak) * (HEIGHT - PAD.top - PAD.bottom);
  const line = series
    .map((point, index) => `${index === 0 ? "M" : "L"}${x(index).toFixed(1)} ${y(point.count).toFixed(1)}`)
    .join(" ");
  const baseline = (HEIGHT - PAD.bottom).toFixed(1);
  const area = `${line} L${x(series.length - 1).toFixed(1)} ${baseline} L${x(0).toFixed(1)} ${baseline} Z`;

  const day = (value: string) => new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" });
  return <figure className="dashboard-chart" role="img" aria-label={label}>
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio="none">
      <line className="dashboard-chart-axis" x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={baseline} />
      <line className="dashboard-chart-axis" x1={PAD.left} y1={baseline} x2={WIDTH - PAD.right} y2={baseline} />
      <path className="dashboard-chart-area" d={area} />
      <path className="dashboard-chart-line" d={line} />
      {series.map((point, index) => (
        <circle key={point.day} className="dashboard-chart-point" cx={x(index)} cy={y(point.count)} r={3}>
          <title>{`${day(point.day).format(new Date(point.day))}: ${point.count}`}</title>
        </circle>
      ))}
    </svg>
    <figcaption>
      <span>{day(series[0].day).format(new Date(series[0].day))}</span>
      <strong>{`${peak}`}</strong>
      <span>{day(series[series.length - 1].day).format(new Date(series[series.length - 1].day))}</span>
    </figcaption>
  </figure>;
}
