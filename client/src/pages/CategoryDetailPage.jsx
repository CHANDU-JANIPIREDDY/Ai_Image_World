import { useEffect } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ImageOff } from 'lucide-react';

import { Seo } from '@/components/common/Seo';
import { ImageGrid } from '@/components/common/ImageGrid';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorBlock } from '@/components/common/ErrorBlock';
import { Pagination } from '@/components/ui/Pagination';
import { Button } from '@/components/ui/Button';
import { useCategoryBySlug } from '@/hooks/useCategories';
import { trackCategoryView } from '@/utils/analytics';
import { formatCount } from '@/utils/format';

const SORTS = [
  { value: 'latest', label: 'Latest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'popular', label: 'Most viewed' },
  { value: 'most_copied', label: 'Most copied' },
  { value: 'most_liked', label: 'Most liked' },
];

const PAGE_SIZE = 24;

/**
 * CategoryDetailPage — GET /categories/:slug (category + paginated images).
 * Page & sort live in the URL so results are shareable and back/forward works.
 */
export default function CategoryDetailPage() {
  const { slug } = useParams();
  const [params, setParams] = useSearchParams();

  const page = Math.max(1, Number(params.get('page')) || 1);
  const sort = params.get('sort') || 'latest';

  const { data, isLoading, isFetching, isError, error, refetch } = useCategoryBySlug(slug, {
    page,
    limit: PAGE_SIZE,
    sort,
  });

  const category = data?.data?.category;
  const images = data?.data?.images ?? [];
  const meta = data?.meta;

  // Track a category view once the category resolves.
  useEffect(() => {
    if (category?._id) trackCategoryView(category._id);
  }, [category?._id]);

  const patchParams = (patch) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => next.set(k, v));
    setParams(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 404 — category slug not found.
  if (isError && error?.status === 404) {
    return (
      <>
        <Seo title="Category not found" />
        <EmptyState
          icon={ImageOff}
          title="Category not found"
          message="This category doesn't exist or is no longer available."
          action={
            <Link to="/categories">
              <Button>Browse categories</Button>
            </Link>
          }
        />
      </>
    );
  }

  return (
    <>
      <Seo
        title={category?.seoTitle || category?.name || slug}
        description={
          category?.seoDescription ||
          category?.description ||
          `Explore AI-generated ${category?.name || slug} images and prompts.`
        }
        image={category?.thumbnailUrl}
      />

      <section className="mx-auto max-w-7xl px-6 py-12">
        <Link
          to="/categories"
          className="mb-6 inline-flex items-center gap-1 text-sm text-content-muted transition-colors hover:text-content"
        >
          <ArrowLeft className="h-4 w-4" /> All categories
        </Link>

        {/* Header */}
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between md:mb-8">
          <div>
            <h1 className="text-[28px] font-bold capitalize leading-[1.15] md:text-3xl">{category?.name || slug}</h1>
            {category?.description && (
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-content-muted md:text-base">{category.description}</p>
            )}
            {typeof category?.imageCount === 'number' && (
              <p className="mt-1 text-sm text-content-muted">
                {formatCount(category.imageCount)} images
              </p>
            )}
          </div>

          {/* Sort */}
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
        </header>

        {/* Images */}
        {isError ? (
          <ErrorBlock message="Couldn't load images for this category." onRetry={refetch} />
        ) : !isLoading && images.length === 0 ? (
          <EmptyState
            icon={ImageOff}
            title="No images yet"
            message="This category doesn't have any published images yet."
          />
        ) : (
          <>
            <div className={isFetching && !isLoading ? 'opacity-60 transition-opacity' : undefined}>
              <ImageGrid images={images} isLoading={isLoading} />
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
