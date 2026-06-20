import { useEffect, useRef } from 'react';

import { cn } from '@/utils/cn';
import { ImageCard } from './ImageCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { Spinner } from '@/components/ui/Spinner';

/**
 * ImageGrid — responsive masonry grid with infinite-scroll support.
 *
 * Props:
 *   images          : array of image objects
 *   isLoading       : initial load (renders skeletons)
 *   hasMore         : whether more pages exist
 *   onLoadMore      : called when the sentinel scrolls into view
 *   isFetchingMore  : next-page load in progress
 */
function ImageGrid({
  images = [],
  isLoading,
  hasMore,
  onLoadMore,
  isFetchingMore,
  onImageClick,
  className,
}) {
  const sentinelRef = useRef(null);

  useEffect(() => {
    if (!hasMore || !onLoadMore) return undefined;
    const el = sentinelRef.current;
    if (!el) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetchingMore) onLoadMore();
      },
      { rootMargin: '600px' } // prefetch before the user reaches the end
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, onLoadMore, isFetchingMore]);

  const columns = 'columns-2 sm:columns-3 lg:columns-4 2xl:columns-5';

  if (isLoading) {
    return (
      <div className={cn(columns, 'gap-4 [&>*]:mb-4', className)}>
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton key={i} className={cn('w-full', i % 2 ? 'h-72' : 'h-56')} />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className={cn(columns, 'gap-4 [&>*]:mb-4', className)}>
        {images.map((image) => (
          <ImageCard
            key={image._id || image.id}
            image={image}
            onClick={onImageClick ? () => onImageClick(image) : undefined}
            className="break-inside-avoid"
          />
        ))}
      </div>

      {/* Infinite-scroll sentinel + loader */}
      {hasMore && <div ref={sentinelRef} aria-hidden="true" className="h-1" />}
      {isFetchingMore && (
        <div className="flex justify-center py-8">
          <Spinner size="lg" />
        </div>
      )}
    </div>
  );
}

export { ImageGrid };
