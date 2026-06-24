import { LayoutGrid, ImageOff } from 'lucide-react';

import { Seo } from '@/components/common/Seo';
import { ImageGrid } from '@/components/common/ImageGrid';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorBlock } from '@/components/common/ErrorBlock';
import { useInfiniteImages } from '@/hooks/useImages';

/**
 * GalleryPage — the full gallery of every published image (the "Explore the
 * gallery" target). Uses GET /images with no filters and infinite scroll so the
 * entire collection is browsable.
 */
export default function GalleryPage() {
  const gallery = useInfiniteImages({ sort: 'latest' });
  const images = gallery.data?.pages.flatMap((p) => p.data) ?? [];

  return (
    <>
      <Seo
        title="Gallery"
        description="Browse the full gallery of AI-generated images — thousands of stunning creations with copy-ready prompts."
      />

      <section className="mx-auto max-w-7xl px-6 py-12">
        <header className="mb-6 md:mb-8">
          <h1 className="flex items-center gap-2 text-[28px] font-bold leading-[1.15] md:text-3xl">
            <LayoutGrid className="h-6 w-6 text-primary md:h-7 md:w-7" />
            <span className="gradient-text">Explore the Gallery</span>
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-content-muted md:text-base">
            Every AI-generated image in one place — scroll to discover thousands of
            creations and copy their prompts in a single click.
          </p>
        </header>

        {gallery.isError ? (
          <ErrorBlock message="Couldn't load the gallery." onRetry={gallery.refetch} />
        ) : !gallery.isLoading && images.length === 0 ? (
          <EmptyState
            icon={ImageOff}
            title="The gallery is empty"
            message="Published AI artwork will appear here as it's added."
          />
        ) : (
          <ImageGrid
            images={images}
            isLoading={gallery.isLoading}
            hasMore={gallery.hasNextPage}
            onLoadMore={gallery.fetchNextPage}
            isFetchingMore={gallery.isFetchingNextPage}
          />
        )}
      </section>
    </>
  );
}
