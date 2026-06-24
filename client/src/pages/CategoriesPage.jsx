import { Sparkles, ImageOff } from 'lucide-react';

import { Seo } from '@/components/common/Seo';
import { CategoryCard } from '@/components/common/CategoryCard';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorBlock } from '@/components/common/ErrorBlock';
import { Skeleton } from '@/components/ui/Skeleton';
import { useCategories } from '@/hooks/useCategories';

/**
 * CategoriesPage — full category grid (GET /categories?active=true&includeCounts=true).
 * Shows each category card with its image count.
 */
export default function CategoriesPage() {
  const { data, isLoading, isError, refetch } = useCategories({
    active: true,
    includeCounts: true,
  });

  const categories = data?.data ?? [];

  return (
    <>
      <Seo
        title="Categories"
        description="Browse AI-generated image collections by theme — anime art, AI portraits, cyberpunk, fantasy worlds, 3D renders and more."
      />

      <section className="mx-auto max-w-7xl px-6 py-12">
        <header className="mb-6 md:mb-8">
          <h1 className="flex items-center gap-2 text-[28px] font-bold leading-[1.15] md:text-3xl">
            <Sparkles className="h-6 w-6 text-primary md:h-7 md:w-7" /> Categories
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-content-muted md:text-base">Explore AI-generated images by theme.</p>
        </header>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[4/3]" />
            ))}
          </div>
        ) : isError ? (
          <ErrorBlock message="Couldn't load categories." onRetry={refetch} />
        ) : categories.length === 0 ? (
          <EmptyState
            icon={ImageOff}
            title="No categories yet"
            message="Categories will appear here once they're published."
          />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {categories.map((category) => (
              <CategoryCard key={category._id || category.slug} category={category} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
