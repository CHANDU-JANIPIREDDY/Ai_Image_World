import { Users, Search, Eye, Copy } from 'lucide-react';

import { Seo } from '@/components/common/Seo';
import { StatCard } from '@/components/admin/StatCard';
import { LineChart } from '@/components/admin/charts/LineChart';
import { BarChart } from '@/components/admin/charts/BarChart';
import { Spinner } from '@/components/ui/Spinner';
import {
  useAnalyticsSummary,
  useTopImages,
  useTopCategories,
  useTopSearches,
} from '@/hooks/useAnalytics';
import { formatCount } from '@/utils/format';

export default function AnalyticsDashboardPage() {
  const summary = useAnalyticsSummary();
  const topImages = useTopImages({ limit: 8 });
  const topCategories = useTopCategories({ limit: 8 });
  const topSearches = useTopSearches({ limit: 8 });

  const s = summary.data?.data;
  const series = (s?.series ?? []).map((d) => ({ date: d.date, value: d.visitors }));
  const images = topImages.data?.data ?? [];
  const categories = topCategories.data?.data ?? [];
  const searches = topSearches.data?.data ?? [];
  const searchVolume = searches.reduce((acc, r) => acc + (r.count || 0), 0);

  return (
    <>
      <Seo title="Analytics" />
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
        <p className="mt-1 text-sm text-content-muted">Engagement from the analytics API.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Users} label="Total Visits" value={formatCount(s?.totalVisitors ?? 0)} hint={`${formatCount(s?.monthVisitors ?? 0)} this month`} />
        <StatCard icon={Search} label="Search Volume" value={formatCount(searchVolume)} hint="Top queries" />
        <StatCard icon={Eye} label="Published Images" value={formatCount(s?.publishedImages ?? 0)} />
        <StatCard icon={Copy} label="Today's Visits" value={formatCount(s?.todayVisitors ?? 0)} />
      </div>

      {/* Visitors series */}
      <div className="mt-6 rounded-2xl glass-panel p-5">
        <h2 className="mb-4 text-sm font-semibold text-content-muted">Visitors (last 30 days)</h2>
        {summary.isLoading ? (
          <div className="flex h-44 items-center justify-center">
            <Spinner />
          </div>
        ) : (
          <LineChart data={series} height={200} />
        )}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Top categories */}
        <div className="rounded-2xl glass-panel p-5">
          <h2 className="mb-4 text-sm font-semibold text-content-muted">Top Categories (by views)</h2>
          <BarChart data={categories.map((c) => ({ label: c.name, value: c.views || c.eventViews || 0 }))} />
        </div>

        {/* Prompt copy analytics */}
        <div className="rounded-2xl glass-panel p-5">
          <h2 className="mb-4 text-sm font-semibold text-content-muted">Prompt Copies (top images)</h2>
          <BarChart data={images.map((i) => ({ label: i.title, value: i.promptCopyCount || 0 }))} />
        </div>
      </div>

      {/* Top images table */}
      <div className="mt-6 rounded-2xl glass-panel p-5">
        <h2 className="mb-4 text-sm font-semibold text-content-muted">Top Images</h2>
        {topImages.isLoading ? (
          <div className="flex h-24 items-center justify-center">
            <Spinner />
          </div>
        ) : images.length === 0 ? (
          <p className="py-6 text-center text-sm text-content-muted">No data yet.</p>
        ) : (
          <ul className="divide-y divide-white/5">
            {images.map((i) => (
              <li key={i._id || i.id} className="flex items-center gap-3 py-2.5">
                <img src={i.thumbnailUrl} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover" />
                <span className="min-w-0 flex-1 truncate text-sm text-content">{i.title}</span>
                <span className="shrink-0 text-xs text-content-muted">
                  {formatCount(i.views)} views · {formatCount(i.promptCopyCount)} copies
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
