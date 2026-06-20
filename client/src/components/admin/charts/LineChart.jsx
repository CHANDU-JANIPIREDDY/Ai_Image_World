import { useId } from 'react';

/**
 * LineChart — dependency-free SVG area/line chart for a time series.
 * data: [{ date, value }] in chronological order.
 */
export function LineChart({ data = [], height = 180, emptyLabel = 'No data yet' }) {
  const gradId = useId();

  if (!data.length) {
    return <p className="py-12 text-center text-sm text-content-muted">{emptyLabel}</p>;
  }

  const W = 600;
  const H = height;
  const pad = 8;
  const max = Math.max(...data.map((d) => d.value), 1);
  const n = data.length;

  const x = (i) => (n === 1 ? W / 2 : pad + (i * (W - pad * 2)) / (n - 1));
  const y = (v) => H - pad - (v / max) * (H - pad * 2);

  const linePts = data.map((d, i) => `${x(i)},${y(d.value)}`).join(' ');
  const areaPts = `${pad},${H - pad} ${linePts} ${W - pad},${H - pad}`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgb(124 58 237)" stopOpacity="0.45" />
          <stop offset="100%" stopColor="rgb(124 58 237)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPts} fill={`url(#${gradId})`} />
      <polyline
        points={linePts}
        fill="none"
        stroke="rgb(139 92 246)"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
