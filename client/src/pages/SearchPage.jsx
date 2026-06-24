import { Search as SearchIcon, SearchX } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

import { Seo } from '@/components/common/Seo';
import { ImageGrid } from '@/components/common/ImageGrid';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorBlock } from '@/components/common/ErrorBlock';
import { Pagination } from '@/components/ui/Pagination';
import { useSearchResults } from '@/hooks/useSearch';
import { useCategories } from '@/hooks/useCategories';
import { recordSearchClick } from '@/services/search.api';
import { getSessionId } from '@/utils/session';
import { formatCount } from '@/utils/format';

const SORTS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'latest', label: 'Latest' },
  { value: 'popular', label: 'Most viewed' },
];

const PAGE_SIZE = 24;

/**
 * SearchPage — GET /search with category + sort filters and pagination.
 * Calling the endpoint logs the search server-side; clicking a result records a
 * click-through (POST /search/click). All state lives in the URL.
 */
export default function SearchPage() {
  const [params, setParams] = useSearchParams();

  const q = params.get('q') || '';
  const category = params.get('category') || '';
  const sort = params.get('sort') || 'relevance';
  const page = Math.max(1, Number(params.get('page')) || 1);

  const { data, isLoading, isFetching, isError, refetch } = useSearchResults({
    q,
    category: category || undefined,
    sort,
    page,
    limit: PAGE_SIZE,
  });

  const { data: catData } = useCategories({ active: true });
  const categories = catData?.data ?? [];

  const images = data?.data ?? [];
  const meta = data?.meta;

  const patchParams = (patch) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => {
      if (v === '' || v == null) next.delete(k);
      else next.set(k, v);
    });
    setParams(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResultClick = (image) => {
    if (image?._id && q) {
      recordSearchClick({ query: q, imageId: image._id, sessionId: getSessionId() });
    }
  };

  return (
    <>
      <Seo
        title={q ? `Search: ${q}` : 'Search'}
        description={
          q
            ? `Search results for “${q}” across thousands of AI-generated images.`
            : 'Search thousands of AI-generated images and prompts.'
        }
      />

      <section className="mx-auto max-w-7xl px-6 py-12">
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between md:mb-8">
          <div>
            <h1 className="flex items-center gap-2 text-[28px] font-bold leading-[1.15] md:text-3xl">
              <SearchIcon className="h-6 w-6 text-primary md:h-7 md:w-7" /> Search
            </h1>
            {q && (
              <p className="mt-2 text-sm text-content-muted md:text-base">
                {meta ? `${formatCount(meta.total)} results for ` : 'Results for '}
                <span className="text-content">“{q}”</span>
              </p>
            )}
          </div>

          {/* Filters */}
          {q && (
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-content-muted">
                Category
                <select
                  value={category}
                  onChange={(e) => patchParams({ category: e.target.value, page: 1 })}
                  className="h-10 rounded-xl border border-white/10 bg-surface px-3 text-content focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="">All</option>
                  {categories.map((c) => (
                    <option key={c._id || c.slug} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex items-center gap-2 text-sm text-content-muted">
                Sort
                <select
                  value={sort}
                  onChange={(e) => patchParams({ sort: e.target.value, page: 1 })}
                  className="h-10 rounded-xl border border-white/10 bg-surface px-3 text-content focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  {SORTS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}
        </header>

        {/* Body */}
        {!q ? (
          <EmptyState
            icon={SearchIcon}
            title="Search AI Image World"
            message="Type a keyword, style, or prompt in the search bar to get started."
          />
        ) : isError ? (
          <ErrorBlock message="Search failed. Please try again." onRetry={refetch} />
        ) : !isLoading && images.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title="No results found"
            message={`We couldn't find anything for “${q}”. Try a different keyword or filter.`}
          />
        ) : (
          <>
            <div className={isFetching && !isLoading ? 'opacity-60 transition-opacity' : undefined}>
              <ImageGrid images={images} isLoading={isLoading} onImageClick={handleResultClick} />
            </div>

            <Pagination
              className="mt-10"
              page={meta?.page || page}
              totalPages={meta?.totalPages || 0}
              onPageChange={(p) => patchParams({ page: p })}
            />
          </>
        )}
      </section>
    </>
  );
}
