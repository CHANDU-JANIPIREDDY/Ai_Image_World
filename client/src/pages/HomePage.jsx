import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TrendingUp, Sparkles, Clock, ArrowRight, AlertCircle, ImageOff } from 'lucide-react';

import heroVideo from '@/assets/Homepage.mp4';
import { Seo } from '@/components/common/Seo';
import { ImageCard } from '@/components/common/ImageCard';
import { ImageGrid } from '@/components/common/ImageGrid';
import { CategoryCard } from '@/components/common/CategoryCard';
import { CreatedWithAIModelsSection } from '@/components/common/CreatedWithAIModelsSection';
import { EmptyState } from '@/components/common/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { useTrendingImages, useLatestImages } from '@/hooks/useImages';
import { useCategories } from '@/hooks/useCategories';

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.5, ease: 'easeOut' },
};

/** Section heading with an optional "view all" link. */
function SectionHeader({ icon: Icon, title, to, linkLabel = 'View all' }) {
  return (
    <div className="mb-4 flex items-center justify-between md:mb-6">
      <h2 className="flex items-center gap-2 text-xl font-semibold leading-snug md:text-3xl md:font-bold">
        {Icon && <Icon className="h-5 w-5 text-primary md:h-7 md:w-7" />}
        <span className="gradient-text">{title}</span>
      </h2>
      {to && (
        <Link
          to={to}
          className="inline-flex items-center gap-1 text-sm text-content-muted transition-colors hover:text-content"
        >
          {linkLabel} <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}

/** Inline error block with retry. */
function ErrorBlock({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl glass-panel px-6 py-10 text-center">
      <AlertCircle className="h-8 w-8 text-red-400" />
      <p className="text-sm text-content-muted">{message || 'Something went wrong.'}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

export default function HomePage() {
  const trending = useTrendingImages({ limit: 10 });
  const categories = useCategories({ active: true });
  const latest = useLatestImages();

  const trendingImages = trending.data?.data ?? [];
  const featuredCategories = (categories.data?.data ?? []).slice(0, 8);
  const latestImages = latest.data?.pages.flatMap((p) => p.data) ?? [];

  return (
    <>
      <Seo description="Explore thousands of stunning AI-generated images and copy production-ready prompts — all in one beautifully curated gallery." />

      {/* ─────────────────── Hero — butterfly video + centered title ─────────────────── */}
      <section className="relative h-screen min-h-screen w-full overflow-hidden">
        {/* Fullscreen looping video background */}
        <video
          className="absolute inset-0 h-full w-full object-cover"
          src={heroVideo}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden="true"
          tabIndex={-1}
        />

        {/* Very light overlay for readability (butterflies stay clearly visible) */}
        <div aria-hidden="true" className="absolute inset-0 bg-black/20" />
        {/* Subtle bottom fade to blend the hero into the page below */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background"
        />

        {/* Centered brand title — visible immediately, elegant and minimal */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
          <motion.h1
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="text-[30px] font-extrabold leading-[1.15] tracking-tight text-white sm:text-4xl md:text-7xl md:leading-tight [text-shadow:0_2px_40px_rgba(124,58,237,0.45)]"
          >
            AI Image{' '}
            <span className="bg-gradient-to-r from-primary-hover via-fuchsia-400 to-secondary bg-clip-text text-transparent">
              World
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
            className="mt-3 max-w-[640px] text-sm font-light leading-relaxed tracking-wide text-white/80 md:mt-5 md:text-lg"
          >
            Where imagination meets intelligence — discover the world&apos;s most
            inspiring AI art.
          </motion.p>
        </div>
      </section>

      {/* ───────────────────── Created With AI Models ───────────────────── */}
      <CreatedWithAIModelsSection />

      {/* ───────────────────── Featured Categories ───────────────────── */}
      <motion.section {...fadeUp} className="mx-auto max-w-7xl px-6 py-8 md:py-10">
        <SectionHeader icon={Sparkles} title="Explore by Category" to="/categories" />
        {categories.isLoading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[4/3]" />
            ))}
          </div>
        ) : categories.isError ? (
          <ErrorBlock message="Couldn't load categories." onRetry={categories.refetch} />
        ) : featuredCategories.length === 0 ? (
          <EmptyState
            icon={ImageOff}
            title="Categories coming soon"
            message="We're curating collections — check back shortly."
          />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {featuredCategories.map((c) => (
              <CategoryCard key={c._id || c.id || c.slug} category={c} />
            ))}
          </div>
        )}
      </motion.section>

      {/* ───────────────────── Trending Images ───────────────────── */}
      <motion.section {...fadeUp} className="mx-auto max-w-7xl px-6 py-8 md:py-10">
        <SectionHeader icon={TrendingUp} title="Trending Now" to="/trending" linkLabel="See all" />
        {trending.isLoading ? (
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-60 w-44 shrink-0" />
            ))}
          </div>
        ) : trending.isError ? (
          <ErrorBlock message="Couldn't load trending images." onRetry={trending.refetch} />
        ) : trendingImages.length === 0 ? (
          <EmptyState
            icon={ImageOff}
            title="Nothing trending yet"
            message="Popular images will appear here as the community explores."
          />
        ) : (
          <div className="no-scrollbar -mx-2 flex gap-4 overflow-x-auto px-2 pb-2">
            {trendingImages.map((image) => (
              <ImageCard
                key={image._id || image.id}
                image={image}
                className="w-44 shrink-0 sm:w-52"
              />
            ))}
          </div>
        )}
      </motion.section>

      {/* ───────────────────── Latest (Infinite Masonry) ───────────────────── */}
      <motion.section {...fadeUp} className="mx-auto max-w-7xl px-6 py-8 md:py-10">
        <SectionHeader icon={Clock} title="Fresh Off the Canvas" />
        {latest.isError ? (
          <ErrorBlock message="Couldn't load the latest images." onRetry={latest.refetch} />
        ) : !latest.isLoading && latestImages.length === 0 ? (
          <EmptyState
            icon={ImageOff}
            title="The gallery is just getting started"
            message="Fresh AI artwork will appear here as it's published."
          />
        ) : (
          <ImageGrid
            images={latestImages}
            isLoading={latest.isLoading}
            hasMore={latest.hasNextPage}
            onLoadMore={latest.fetchNextPage}
            isFetchingMore={latest.isFetchingNextPage}
          />
        )}
      </motion.section>
    </>
  );
}
