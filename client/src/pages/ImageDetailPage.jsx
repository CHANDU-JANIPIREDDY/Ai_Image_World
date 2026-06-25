import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
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
import { TopImageModelsSection } from '@/components/common/TopImageModelsSection';
import { CopyPromptButton } from '@/components/common/CopyPromptButton';
import { LikeButton } from '@/components/common/LikeButton';
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
    transition: { staggerChildren: 0.06, delayChildren: 0.04 },
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

/** A compact glass stat badge (views, copies, tool, date) — fills its grid cell. */
function MetaChip({ icon: Icon, children }) {
  return (
    <span className="inline-flex w-full min-w-0 items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-2.5 py-2 text-xs font-medium text-content-muted backdrop-blur-glass">
      <Icon className="h-3.5 w-3.5 shrink-0 text-primary/90" aria-hidden="true" />
      <span className="truncate">{children}</span>
    </span>
  );
}

/**
 * ImageStage — height-capped, aspect-preserving hero. The image is centered and
 * never exceeds 500px tall on desktop (≈30% smaller than the old 9:16 frame),
 * so it sits balanced beside the details instead of dominating the page.
 * Features: shimmer skeleton, fade-in on load, soft shadow, gentle hover zoom.
 */
function ImageStage({ src, alt }) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  if (errored) {
    return (
      <div className="mx-auto flex aspect-[3/4] w-full max-w-sm flex-col items-center justify-center gap-2 rounded-[20px] border border-white/10 bg-surface text-content-muted">
        <ImageOff className="h-10 w-10" aria-hidden="true" />
        <span className="text-sm">Image unavailable</span>
      </div>
    );
  }

  return (
    <motion.figure variants={fadeIn} className="group relative mx-auto w-fit max-w-full lg:mx-0">
      {/* Ambient glow behind the frame */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-6 -z-10 bg-glow-radial opacity-70 blur-2xl"
      />

      {/* Frosted glass frame the image sits on */}
      <div className="relative rounded-[26px] glass-panel p-2.5 shadow-glass">
        {/* Shimmer while the asset streams in — overlays the (invisible) image */}
        {!loaded && (
          <Skeleton className="absolute inset-2.5 h-auto w-auto rounded-[18px]" />
        )}

        <motion.img
          src={src}
          alt={alt}
          loading="eager"
          onLoad={() => setLoaded(true)}
          onError={() => setErrored(true)}
          initial={{ opacity: 0 }}
          animate={{ opacity: loaded ? 1 : 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className={cn(
            'block h-auto max-h-[420px] w-auto max-w-full rounded-[18px] object-contain ring-1 ring-inset ring-white/10 sm:max-h-[520px]',
            'transition-transform duration-500 ease-out group-hover:scale-[1.02]',
            // Reserve space for the shimmer before the natural dimensions are known.
            !loaded && 'min-h-[340px] w-full max-w-xs'
          )}
        />
      </div>
    </motion.figure>
  );
}

/**
 * PromptPanel — premium "documentation panel": header bar + internally scrollable
 * body. The card is a fixed 16:9 rectangle (height derived from its width, never
 * from content length), so two panels placed side by side are perfectly equal.
 * Body scrolls (hidden scrollbar) only when the content overflows.
 */
function PromptPanel({ label, icon: Icon, text, tone = 'primary' }) {
  const toneText = tone === 'muted' ? 'text-content-muted' : 'text-content/90';
  const charCount = text?.length ?? 0;

  return (
    <motion.section
      variants={fadeUp}
      whileHover={{ y: -2 }}
      transition={{ type: 'spring', stiffness: 300, damping: 26 }}
      className="flex aspect-[16/9] flex-col overflow-hidden rounded-[20px] glass-panel transition-shadow duration-300 hover:shadow-glow"
    >
      {/* Header — stays put while the body scrolls */}
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-white/[0.06] bg-white/[0.03] px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-content-muted">
            {label}
          </h2>
        </div>
        <span className="font-mono text-[11px] tabular-nums text-content-muted/70">
          {charCount.toLocaleString()} chars
        </span>
      </header>

      {/* Scrollable body — fills the card, hidden scrollbar, no horizontal overflow */}
      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain bg-black/20 px-4 py-3.5">
        <p
          className={cn(
            'whitespace-pre-wrap break-words font-sans text-[13px] leading-[1.6] [overflow-wrap:anywhere]',
            toneText
          )}
        >
          {text || '—'}
        </p>
      </div>
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
      <section className="mx-auto max-w-7xl px-6 py-10 sm:py-12">
        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,40fr)_minmax(0,60fr)]">
          <Skeleton className="mx-auto h-[420px] w-full max-w-sm rounded-[20px] sm:h-[520px] lg:mx-0" />
          <div className="space-y-4">
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-9 w-3/4" />
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Skeleton className="h-9 rounded-xl" />
              <Skeleton className="h-9 rounded-xl" />
              <Skeleton className="h-9 rounded-xl" />
              <Skeleton className="h-9 rounded-xl" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Skeleton className="aspect-[16/9] rounded-[20px]" />
              <Skeleton className="aspect-[16/9] rounded-[20px]" />
            </div>
            <Skeleton className="h-11 w-full rounded-xl" />
            <Skeleton className="h-7 w-40 rounded-lg" />
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

      <section className="mx-auto max-w-7xl px-6 py-10 sm:py-12">
        {/* Back link */}
        <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}>
          <Link
            to={category?.slug ? `/category/${category.slug}` : '/categories'}
            className="mb-6 inline-flex items-center gap-1.5 text-sm text-content-muted transition-colors hover:text-content"
          >
            <ArrowLeft className="h-4 w-4" /> {category?.name || 'Categories'}
          </Link>
        </motion.div>

        {/* Main split layout: image 42% left, details 58% right; stacks on mobile */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid items-start gap-8 lg:grid-cols-[minmax(0,40fr)_minmax(0,60fr)]"
        >
          {/* ----------------------------- Image ---------------------------- */}
          <div className="relative lg:pt-1">
            <ImageStage src={image.imageUrl} alt={image.title} />
          </div>

          {/* ---------------------------- Details --------------------------- */}
          <div className="min-w-0 space-y-5">
            {/* Category kicker + title + 4-up stat grid */}
            <motion.div variants={fadeUp} className="space-y-3">
              {category?.name && (
                <Link to={`/category/${category.slug}`} className="inline-block">
                  <Badge variant="primary" className="transition-transform hover:scale-105">
                    {category.name}
                  </Badge>
                </Link>
              )}

              <h1 className="text-2xl font-bold leading-tight tracking-tight md:text-3xl">
                {image.title}
              </h1>

              {/* Stats — equal-width badges; single row on desktop, 2×2 on mobile */}
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <MetaChip icon={Eye}>{formatCount(image.views)} views</MetaChip>
                <MetaChip icon={Copy}>{formatCount(image.promptCopyCount)} copies</MetaChip>
                <MetaChip icon={Wand2}>{image.sourceAiTool || '—'}</MetaChip>
                <MetaChip icon={Calendar}>
                  {image.createdAt
                    ? formatMonthYear(image.publishedAt || image.createdAt)
                    : '—'}
                </MetaChip>
              </div>
            </motion.div>

            {/* Prompt + Negative Prompt — 50/50 16:9 cards filling the column */}
            <div
              className={cn('grid gap-4', image.negativePrompt && 'sm:grid-cols-2')}
            >
              <PromptPanel label="Prompt" icon={Sparkles} text={image.prompt} />

              {image.negativePrompt && (
                <PromptPanel
                  label="Negative Prompt"
                  icon={Ban}
                  text={image.negativePrompt}
                  tone="muted"
                />
              )}
            </div>

            {/* Like + Copy actions */}
            <motion.div variants={fadeUp} className="flex items-stretch gap-3">
              <LikeButton imageId={image._id} initialLikes={image.likes} />
              <CopyPromptButton
                prompt={image.prompt}
                imageId={image._id}
                className="flex-1"
              />
            </motion.div>

            {/* Tags */}
            {image.tags?.length > 0 && (
              <motion.div variants={fadeUp}>
                <h2 className="mb-2.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-content-muted">
                  <Tag className="h-3.5 w-3.5" /> Tags
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

        {/* Top image-generation models — Motion-Sync cards (ChatGPT, Gemini, Midjourney).
            Full-bleed wrapper so the panel can be wider than the page's max-w-7xl. */}
        <div className="mt-12 w-screen mx-[calc(50%-50vw)] md:mt-20">
          <TopImageModelsSection />
        </div>

        {/* ----------------------------- Related ---------------------------- */}
        {related.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="mt-12 md:mt-20"
          >
            <h2 className="mb-4 text-xl font-semibold leading-snug md:mb-6 md:text-2xl">Related Images</h2>
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
