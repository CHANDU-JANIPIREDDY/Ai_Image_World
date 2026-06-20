import { Search, TrendingUp, ListOrdered } from 'lucide-react';

import { Seo } from '@/components/common/Seo';
import { StatCard } from '@/components/admin/StatCard';
import { BarChart } from '@/components/admin/charts/BarChart';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorBlock } from '@/components/common/ErrorBlock';
import { useTopSearches } from '@/hooks/useAnalytics';
import { formatCount } from '@/utils/format';

/**
 * SearchAnalyticsPage — GET /analytics/top-searches.
 * Shows the top keywords, total search volume, and average result counts.
 */
export default function SearchAnalyticsPage() {
  const { data, isLoading, isError, refetch } = useTopSearches({ limit: 20 });
  const rows = data?.data ?? [];
  const volume = rows.reduce((acc, r) => acc + (r.count || 0), 0);
  const uniqueQueries = rows.length;

  return (
    <>
      <Seo title="Search Analytics" />
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Search Analytics</h1>
        <p className="mt-1 text-sm text-content-muted">Top search keywords and volume.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard icon={Search} label="Search Volume" value={formatCount(volume)} hint="Across top queries" />
        <StatCard icon={ListOrdered} label="Unique Queries" value={formatCount(uniqueQueries)} />
        <StatCard
          icon={TrendingUp}
          label="Top Keyword"
          value={rows[0]?.query ? `“${rows[0].query}”` : '—'}
          hint={rows[0] ? `${formatCount(rows[0].count)} searches` : undefined}
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : isError ? (
        <ErrorBlock className="mt-6" message="Couldn't load search analytics." onRetry={refetch} />
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl glass-panel p-5">
            <h2 className="mb-4 text-sm font-semibold text-content-muted">Top Keywords (volume)</h2>
            <BarChart data={rows.slice(0, 10).map((r) => ({ label: r.query, value: r.count }))} />
          </div>

          <div className="overflow-hidden rounded-2xl glass-panel">
            <table className="w-full text-sm">
              <thead className="border-b border-white/10 text-left text-content-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Keyword</th>
                  <th className="px-4 py-3 font-medium">Searches</th>
                  <th className="px-4 py-3 font-medium">Avg. results</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.query} className="border-b border-white/5 last:border-0">
                    <td className="px-4 py-2.5 text-content">{r.query}</td>
                    <td className="px-4 py-2.5 text-content-muted">{formatCount(r.count)}</td>
                    <td className="px-4 py-2.5 text-content-muted">{formatCount(r.avgResults ?? 0)}</td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-10 text-center text-content-muted">
                      No searches recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
