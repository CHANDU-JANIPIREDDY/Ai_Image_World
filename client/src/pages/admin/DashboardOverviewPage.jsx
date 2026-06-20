import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { FolderTree, Images as ImagesIcon, Eye, Copy, Search, Users } from 'lucide-react';

import { Seo } from '@/components/common/Seo';
import { StatCard } from '@/components/admin/StatCard';
import { LineChart } from '@/components/admin/charts/LineChart';
import { Spinner } from '@/components/ui/Spinner';
import { useAnalyticsSummary, useTopSearches } from '@/hooks/useAnalytics';
import { useCategories } from '@/hooks/useCategories';
import { getImages } from '@/services/images.api';
import { formatCount } from '@/utils/format';

// Sum views + copies across all published images by paginating /images
// (no dedicated totals endpoint exists; capped to keep it bounded).
async function aggregateImageTotals() {
  let page = 1;
  let totalViews = 0;
  let totalCopies = 0;
  let totalImages = 0;
  const MAX_PAGES = 20;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    // eslint-disable-next-line no-await-in-loop
    const res = await getImages({ page, limit: 50, sort: 'latest' });
    (res.data || []).forEach((img) => {
      totalViews += img.views || 0;
      totalCopies += img.promptCopyCount || 0;
    });
    totalImages = res.meta?.total ?? totalImages;
    if (!res.meta || page >= res.meta.totalPages || page >= MAX_PAGES) break;
    page += 1;
  }
  return { totalViews, totalCopies, totalImages };
}

export default function DashboardOverviewPage() {
  const summary = useAnalyticsSummary();
  const categories = useCategories({ includeCounts: true });
  const topSearches = useTopSearches({ limit: 50 });
  const totals = useQuery({ queryKey: ['admin', 'image-totals'], queryFn: aggregateImageTotals });
  const recent = useQuery({
    queryKey: ['admin', 'recent-uploads'],
    queryFn: () => getImages({ sort: 'latest', limit: 6 }),
  });

  const s = summary.data?.data;
  const categoryCount = categories.data?.data?.length ?? 0;
  const searchVolume = (topSearches.data?.data ?? []).reduce((acc, r) => acc + (r.count || 0), 0);
  const series = (s?.series ?? []).map((d) => ({ date: d.date, value: d.visitors }));
  const recentImages = recent.data?.data ?? [];

  return (
    <>
      <Seo title="Admin Dashboard" />
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Dashboard Overview</h1>
        <p className="mt-1 text-sm text-content-muted">Live metrics from your backend.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard icon={FolderTree} label="Total Categories" value={formatCount(categoryCount)} />
        <StatCard
          icon={ImagesIcon}
          label="Total Images"
          value={formatCount(s?.publishedImages ?? totals.data?.totalImages ?? 0)}
          hint="Published"
        />
        <StatCard icon={Users} label="Total Visits" value={formatCount(s?.totalVisitors ?? 0)} hint={`${formatCount(s?.todayVisitors ?? 0)} today`} />
        <StatCard icon={Eye} label="Total Views" value={totals.isLoading ? '…' : formatCount(totals.data?.totalViews ?? 0)} />
        <StatCard icon={Copy} label="Prompt Copies" value={totals.isLoading ? '…' : formatCount(totals.data?.totalCopies ?? 0)} />
        <StatCard icon={Search} label="Search Volume" value={formatCount(searchVolume)} hint="Top queries" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Visitors series */}
        <div className="rounded-2xl glass-panel p-5 lg:col-span-2">
          <h2 className="mb-4 text-sm font-semibold text-content-muted">Visitors (last 30 days)</h2>
          {summary.isLoading ? (
            <div className="flex h-44 items-center justify-center">
              <Spinner />
            </div>
          ) : (
            <LineChart data={series} />
          )}
        </div>

        {/* Recent uploads */}
        <div className="rounded-2xl glass-panel p-5">
          <h2 className="mb-4 text-sm font-semibold text-content-muted">Recent Uploads</h2>
          {recent.isLoading ? (
            <div className="flex h-44 items-center justify-center">
              <Spinner />
            </div>
          ) : recentImages.length === 0 ? (
            <p className="text-sm text-content-muted">No images yet.</p>
          ) : (
            <ul className="space-y-3">
              {recentImages.map((img) => (
                <li key={img._id}>
                  <Link to={`/image/${img.slug}`} className="flex items-center gap-3 rounded-xl p-1 hover:bg-white/5">
                    <img
                      src={img.thumbnailUrl || img.imageUrl}
                      alt=""
                      className="h-10 w-10 shrink-0 rounded-lg object-cover"
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-sm text-content">{img.title}</span>
                      <span className="block text-xs text-content-muted">
                        {formatCount(img.views)} views
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
