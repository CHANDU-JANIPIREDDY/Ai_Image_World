import { formatCount } from '@/utils/format';

/**
 * BarChart — dependency-free horizontal bar chart.
 * data: [{ label, value }]. Bars are scaled to the max value.
 */
export function BarChart({ data = [], emptyLabel = 'No data yet' }) {
  if (!data.length) {
    return <p className="py-8 text-center text-sm text-content-muted">{emptyLabel}</p>;
  }
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <ul className="space-y-3">
      {data.map((d) => (
        <li key={d.label}>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="truncate pr-2 text-content">{d.label}</span>
            <span className="shrink-0 text-content-muted">{formatCount(d.value)}</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/5">
            <div
              className="h-full rounded-full bg-brand-gradient"
              style={{ width: `${Math.max(2, (d.value / max) * 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
