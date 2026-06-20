import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Eye, Copy, Wand2, Calendar, ImageOff, Tag } from 'lucide-react';

import { Seo } from '@/components/common/Seo';
import { ImageCard } from '@/components/common/ImageCard';
import { CopyPromptButton } from '@/components/common/CopyPromptButton';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorBlock } from '@/components/common/ErrorBlock';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { useImageBySlug } from '@/hooks/useImages';
import { trackImageView } from '@/utils/analytics';
import { formatCount, formatMonthYear } from '@/utils/format';

/** A labeled metadata stat (views, copies, tool, date). */
function Stat({ icon: Icon, children }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-content-muted">
      <Icon className="h-4 w-4" aria-hidden="true" />
      {children}
    </span>
  );
}

/**
 * ImageDetailPage — GET /images/:slug (full image, prompt, tags, views, related).
 * The GET increments views server-side; we also send an image_view analytics
 * event. CopyPromptButton handles POST /images/:id/copy + the copy analytics.
 */
export default function ImageDetailPage() {
  const { slug } = useParams();
  const { data, isLoading, isError, error, refetch } = useImageBySlug(slug);

  const image = data?.data;
  const related = image?.related ?? [];

  useEffect(() => {
    if (image?._id) trackImageView(image._id);
  }, [image?._id]);

  if (isLoading) {
    return (
      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-8 lg:grid-cols-2">
          <Skeleton className="aspect-[3/4] w-full" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-11 w-40" />
          </div>
        </div>
      </section>
    );
  }

  if (isError) {
    if (error?.status === 404) {
      return (
        <>
          <Seo title="Image not found" />
          <EmptyState
            icon={ImageOff}
            title="Image not found"
            message="This image doesn't exist or is no longer available."
            action={
              <Link to="/">
                <Button>Back to home</Button>
              </Link>
            }
          />
        </>
      );
    }
    return (
      <section className="mx-auto max-w-6xl px-6 py-12">
        <ErrorBlock message="Couldn't load this image." onRetry={refetch} />
      </section>
    );
  }

  if (!image) return null;

  const category = image.category;
  const seoDescription = (image.seoDescription || image.prompt || '').slice(0, 160);

  return (
    <>
      <Seo
        title={image.seoTitle || image.title}
        description={seoDescription}
        image={image.imageUrl}
        type="article"
      />

      <section className="mx-auto max-w-6xl px-6 py-12">
        <Link
          to={category?.slug ? `/category/${category.slug}` : '/categories'}
          className="mb-6 inline-flex items-center gap-1 text-sm text-content-muted transition-colors hover:text-content"
        >
          <ArrowLeft className="h-4 w-4" /> {category?.name || 'Categories'}
        </Link>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Image */}
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-surface">
            <img
              src={image.imageUrl}
              alt={image.title}
              className="w-full object-contain"
              loading="eager"
            />
          </div>

          {/* Details */}
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">{image.title}</h1>

            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
              <Stat icon={Eye}>{formatCount(image.views)} views</Stat>
              <Stat icon={Copy}>{formatCount(image.promptCopyCount)} copies</Stat>
              {image.sourceAiTool && <Stat icon={Wand2}>{image.sourceAiTool}</Stat>}
              {image.createdAt && (
                <Stat icon={Calendar}>{formatMonthYear(image.publishedAt || image.createdAt)}</Stat>
              )}
            </div>

            {category?.name && (
              <div className="mt-4">
                <Link to={`/category/${category.slug}`}>
                  <Badge variant="primary">{category.name}</Badge>
                </Link>
              </div>
            )}

            {/* Prompt */}
            <div className="mt-6">
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-content-muted">
                Prompt
              </h2>
              <p className="whitespace-pre-wrap rounded-2xl glass-panel p-4 text-sm leading-relaxed text-content">
                {image.prompt}
              </p>
              <CopyPromptButton prompt={image.prompt} imageId={image._id} className="mt-4" />
            </div>

            {/* Negative prompt */}
            {image.negativePrompt && (
              <div className="mt-6">
                <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-content-muted">
                  Negative prompt
                </h2>
                <p className="whitespace-pre-wrap rounded-2xl glass-panel p-4 text-sm leading-relaxed text-content-muted">
                  {image.negativePrompt}
                </p>
              </div>
            )}

            {/* Tags */}
            {image.tags?.length > 0 && (
              <div className="mt-6">
                <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wide text-content-muted">
                  <Tag className="h-4 w-4" /> Tags
                </h2>
                <div className="flex flex-wrap gap-2">
                  {image.tags.map((tag) => (
                    <Link key={tag} to={`/search?q=${encodeURIComponent(tag)}`}>
                      <Badge className="transition-colors hover:bg-white/20">#{tag}</Badge>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <div className="mt-16">
            <h2 className="mb-6 text-2xl font-semibold">Related Images</h2>
            <div className="columns-2 gap-4 sm:columns-3 lg:columns-4 [&>*]:mb-4">
              {related.map((rel) => (
                <ImageCard key={rel._id} image={rel} className="break-inside-avoid" />
              ))}
            </div>
          </div>
        )}
      </section>
    </>
  );
}
