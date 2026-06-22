import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  ArrowLeft,
  Eye,
  Copy,
  Wand2,
  Calendar,
  ImageOff,
  Tag,
  Sparkles,
  Ban,
} from 'lucide-react';

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
import { cn } from '@/utils/cn';

/* -------------------------------------------------------------------------- */
/*  Animation variants                                                        */
/* -------------------------------------------------------------------------- */

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.04 },
  },
};

// Fade + slide entrance reused by every right-column block.
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  },
};

const fadeIn = {
  hidden: { opacity: 0, scale: 0.97 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

/* -------------------------------------------------------------------------- */
/*  Small building blocks                                                     */
/* -------------------------------------------------------------------------- */

/** A labeled metadata stat (views, copies, tool, date). */
function Stat({ icon: Icon, children }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-content-muted">
      <Icon className="h-4 w-4 text-primary/80" aria-hidden="true" />
      {children}
    </span>
  );
}

/**
 * ImageStage — the 9:16 hero with skeleton loader, fade-in, hover zoom and a
 * subtle continuous floating motion. The fixed aspect ratio guarantees zero
 * layout shift while the asset streams in.
 */
function ImageStage({ src, alt }) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const float = prefersReducedMotion
    ? {}
    : { y: [0, -10, 0], transition: { duration: 6, repeat: Infinity, ease: 'easeInOut' } };

  return (
    <motion.div variants={fadeIn} className="lg:sticky lg:top-24">
      {/* Ambient glow behind the frame */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-glow-radial blur-2xl"
      />

      <motion.div
        animate={float}
        className="group relative aspect-[9/16] w-full overflow-hidden rounded-[24px] border border-white/10 bg-surface shadow-glass"
      >
        {/* Skeleton placeholder while the image streams in */}
        <AnimatePresence>
          {!loaded && !errored && (
            <motion.div
              key="skeleton"
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0"
            >
              <Skeleton className="h-full w-full rounded-[24px]" />
            </motion.div>
          )}
        </AnimatePresence>

        {errored ? (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-content-muted">
            <ImageOff className="h-10 w-10" aria-hidden="true" />
            <span className="text-sm">Image unavailable</span>
          </div>
        ) : (
          <img
            src={src}
            alt={alt}
            loading="eager"
            onLoad={() => setLoaded(true)}
            onError={() => setErrored(true)}
            className={cn(
              'h-full w-full object-cover transition-[transform,opacity] duration-700 ease-out',
              'group-hover:scale-[1.05]',
              loaded ? 'opacity-100' : 'opacity-0'
            )}
          />
        )}

        {/* Hover sheen — bottom-up gradient for a premium gallery feel */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        />
        {/* Inner ring highlight */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[24px] ring-1 ring-inset ring-white/10"
        />
      </motion.div>
    </motion.div>
  );
}

/**
 * PromptPanel — premium "documentation panel": header bar, internally scrollable
 * monospace body with a fixed max-height (no page-height growth), custom slim
 * scrollbar, and an optional always-visible footer (e.g. the copy action).
 */
function PromptPanel({ label, icon: Icon, text, maxHeightClass, tone = 'primary', footer }) {
  const toneText = tone === 'muted' ? 'text-content-muted' : 'text-content/90';
  const charCount = text?.length ?? 0;

  return (
    <motion.section
      variants={fadeUp}
      whileHover={{ y: -3 }}
      transition={{ type: 'spring', stiffness: 300, damping: 26 }}
      className="overflow-hidden rounded-[20px] glass-panel transition-shadow duration-300 hover:shadow-glow"
    >
      {/* Header — stays put while the body scrolls */}
      <header className="flex items-center justify-between gap-3 border-b border-white/10 bg-white/[0.03] px-5 py-3">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-content-muted">
            {label}
          </h2>
        </div>
        <span className="font-mono text-[11px] tabular-nums text-content-muted/70">
          {charCount.toLocaleString()} chars
        </span>
      </header>

      {/* Scrollable body — fixed cap + slim custom scrollbar, never grows the page */}
      <div
        className={cn(
          'scroll-panel overflow-y-auto overscroll-contain bg-black/20 px-5 py-4',
          maxHeightClass
        )}
      >
        <pre
          className={cn(
            'whitespace-pre-wrap break-words font-mono text-[13px] leading-relaxed',
            toneText
          )}
        >
          {text}
        </pre>
      </div>

      {footer && (
        <div className="border-t border-white/10 bg-white/[0.03] p-3">{footer}</div>
      )}
    </motion.section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

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

  /* ----------------------------- Loading ----------------------------- */
  if (isLoading) {
    return (
      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,420px)_1fr]">
          <Skeleton className="aspect-[9/16] w-full rounded-[24px]" />
          <div className="space-y-5">
            <Skeleton className="h-9 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-7 w-28 rounded-full" />
            <Skeleton className="h-64 w-full rounded-[20px]" />
            <Skeleton className="h-44 w-full rounded-[20px]" />
          </div>
        </div>
      </section>
    );
  }

  /* ------------------------------ Error ------------------------------ */
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

      <section className="mx-auto max-w-6xl px-6 py-10 sm:py-12">
        {/* Back link */}
        <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}>
          <Link
            to={category?.slug ? `/category/${category.slug}` : '/categories'}
            className="mb-8 inline-flex items-center gap-1.5 text-sm text-content-muted transition-colors hover:text-content"
          >
            <ArrowLeft className="h-4 w-4" /> {category?.name || 'Categories'}
          </Link>
        </motion.div>

        {/* Main split layout: image left, content right; stacks on mobile */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid gap-10 lg:grid-cols-[minmax(0,420px)_1fr] lg:items-start"
        >
          {/* ----------------------------- Image ---------------------------- */}
          <div className="relative">
            <ImageStage src={image.imageUrl} alt={image.title} />
          </div>

          {/* ---------------------------- Details --------------------------- */}
          <div className="min-w-0 space-y-6">
            {/* Title + meta */}
            <motion.div variants={fadeUp}>
              <h1 className="text-2xl font-bold leading-tight tracking-tight sm:text-3xl lg:text-4xl">
                {image.title}
              </h1>

              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
                <Stat icon={Eye}>{formatCount(image.views)} views</Stat>
                <Stat icon={Copy}>{formatCount(image.promptCopyCount)} copies</Stat>
                {image.sourceAiTool && <Stat icon={Wand2}>{image.sourceAiTool}</Stat>}
                {image.createdAt && (
                  <Stat icon={Calendar}>
                    {formatMonthYear(image.publishedAt || image.createdAt)}
                  </Stat>
                )}
              </div>

              {category?.name && (
                <div className="mt-4">
                  <Link to={`/category/${category.slug}`}>
                    <Badge variant="primary" className="transition-transform hover:scale-105">
                      {category.name}
                    </Badge>
                  </Link>
                </div>
              )}
            </motion.div>

            {/* Prompt — capped height, internal scroll, sticky copy footer */}
            <PromptPanel
              label="Prompt"
              icon={Sparkles}
              text={image.prompt}
              maxHeightClass="max-h-[500px]"
              footer={
                <CopyPromptButton
                  prompt={image.prompt}
                  imageId={image._id}
                  className="w-full"
                />
              }
            />

            {/* Negative prompt — same behavior, shorter cap */}
            {image.negativePrompt && (
              <PromptPanel
                label="Negative Prompt"
                icon={Ban}
                text={image.negativePrompt}
                tone="muted"
                maxHeightClass="max-h-[350px]"
              />
            )}

            {/* Tags */}
            {image.tags?.length > 0 && (
              <motion.div variants={fadeUp}>
                <h2 className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-content-muted">
                  <Tag className="h-4 w-4" /> Tags
                </h2>
                <div className="flex flex-wrap gap-2">
                  {image.tags.map((tag) => (
                    <Link key={tag} to={`/search?q=${encodeURIComponent(tag)}`}>
                      <Badge className="transition-all hover:scale-105 hover:bg-white/20">
                        #{tag}
                      </Badge>
                    </Link>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* ----------------------------- Related ---------------------------- */}
        {related.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="mt-20"
          >
            <h2 className="mb-6 text-2xl font-semibold">Related Images</h2>
            <div className="columns-2 gap-4 sm:columns-3 lg:columns-4 [&>*]:mb-4">
              {related.map((rel) => (
                <ImageCard key={rel._id} image={rel} className="break-inside-avoid" />
              ))}
            </div>
          </motion.div>
        )}
      </section>
    </>
  );
}
