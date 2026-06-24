import { TrendingUp, ImageOff } from 'lucide-react';

import { Seo } from '@/components/common/Seo';
import { ImageGrid } from '@/components/common/ImageGrid';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorBlock } from '@/components/common/ErrorBlock';
import { useTrendingImages } from '@/hooks/useImages';

/**
 * TrendingPage — full gallery of trending images (the homepage "Trending Now"
 * row's "See all" target). Uses the dedicated /images/trending endpoint so it
 * shows genuinely popular images, not a keyword search.
 */
export default function TrendingPage() {
  const trending = useTrendingImages({ limit: 60 });
  const images = trending.data?.data ?? [];

  return (
    <>
      <Seo
        title="Trending Now"
        description="The most popular AI-generated images right now — discover what the community is loving today."
      />

      <section className="mx-auto max-w-7xl px-6 py-12">
        <header className="mb-6 md:mb-8">
          <h1 className="flex items-center gap-2 text-[28px] font-bold leading-[1.15] md:text-3xl">
            <TrendingUp className="h-6 w-6 text-primary md:h-7 md:w-7" />
            <span className="gradient-text">Trending Now</span>
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-content-muted md:text-base">
            The most popular AI-generated images, ranked by what the community is exploring today.
          </p>
        </header>

        {trending.isError ? (
          <ErrorBlock message="Couldn't load trending images." onRetry={trending.refetch} />
        ) : !trending.isLoading && images.length === 0 ? (
          <EmptyState
            icon={ImageOff}
            title="Nothing trending yet"
            message="Popular images will appear here as the community explores."
          />
        ) : (
          <ImageGrid images={images} isLoading={trending.isLoading} />
        )}
      </section>
    </>
  );
}
