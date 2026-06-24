import { Link } from 'react-router-dom';
import { motion, useMotionValue, useMotionTemplate, useSpring } from 'framer-motion';
import { ArrowRight, ArrowUpRight, AlertCircle, ImageOff } from 'lucide-react';

import { cn } from '@/utils/cn';
import { formatCount } from '@/utils/format';
import { Button } from '@/components/ui/Button';

/**
 * ExploreByCategorySection — "OpenArt Suite"-style category block.
 *
 * Styling only: data and navigation behaviour are unchanged. Each card links to
 * `/category/:slug`; the header links to the full categories listing.
 *
 * @param {Array}    categories  Category objects ({ slug, name, description, thumbnailUrl, imageCount }).
 * @param {boolean}  isLoading   Query loading state.
 * @param {boolean}  isError     Query error state.
 * @param {Function} onRetry     Refetch handler for the error state.
 * @param {string}   to          Destination for the "View all" link.
 * @param {string|number} activeId  Optional id/slug of the card to highlight with a green glow.
 */
export function ExploreByCategorySection({
  categories = [],
  isLoading = false,
  isError = false,
  onRetry,
  to = '/categories',
  activeId,
}) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 md:py-10">
      {/* Rounded container — site navy gradient with a soft brand glow */}
      <div className="relative overflow-hidden rounded-[24px] border border-white/[0.06] bg-[linear-gradient(180deg,#161D33_0%,#0B0F19_100%)] p-5 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.9)] sm:p-7">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[radial-gradient(60%_100%_at_50%_0%,rgba(124,58,237,0.18),transparent_70%)]"
        />
        <div className="relative">
        {/* ───────── Header ───────── */}
        <div className="mb-5 flex items-center justify-between sm:mb-6">
          <h2 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
            Explore by Category
          </h2>
          {to && (
            <Link
              to={to}
              className="group inline-flex items-center gap-1.5 text-sm text-gray-400 transition-colors duration-300 hover:text-white"
            >
              View all
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
            </Link>
          )}
        </div>

        {/* ───────── Grid / States ───────── */}
        {isLoading ? (
          <CardGrid>
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-[100px] animate-pulse rounded-[20px] border border-white/[0.06] bg-white/[0.03]"
              />
            ))}
          </CardGrid>
        ) : isError ? (
          <StateBlock>
            <AlertCircle className="h-8 w-8 text-red-400" />
            <p className="text-sm text-gray-300">Couldn&apos;t load categories.</p>
            {onRetry && (
              <Button variant="outline" size="sm" onClick={onRetry}>
                Try again
              </Button>
            )}
          </StateBlock>
        ) : categories.length === 0 ? (
          <StateBlock>
            <ImageOff className="h-8 w-8 text-gray-400" />
            <p className="text-base font-semibold text-white">Categories coming soon</p>
            <p className="text-sm text-gray-400">
              We&apos;re curating collections — check back shortly.
            </p>
          </StateBlock>
        ) : (
          <CardGrid>
            {categories.map((c) => (
              <CategorySuiteCard
                key={c._id || c.id || c.slug}
                category={c}
                active={
                  activeId != null &&
                  (activeId === c._id || activeId === c.id || activeId === c.slug)
                }
              />
            ))}
          </CardGrid>
        )}
        </div>
      </div>
    </section>
  );
}

/** Responsive card grid: 1 / 2 / 3 columns. */
function CardGrid({ children }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4">{children}</div>
  );
}

/** Centered message block reused by the loading/error/empty states. */
function StateBlock({ children }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] px-6 py-12 text-center">
      {children}
    </div>
  );
}

/**
 * Category card with the OpenArt "Motion Sync" hover interaction:
 * mouse-tracked radial green sweep, neon border + outer glow, lift, background
 * brighten, image zoom, neon text, and an animated diagonal arrow.
 */
function CategorySuiteCard({ category, active = false }) {
  const subtitle =
    category.description ||
    (typeof category.imageCount === 'number'
      ? `${formatCount(category.imageCount)} images`
      : '');

  // Mouse tracking for the radial light sweep (smoothly interpolated).
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const smoothX = useSpring(mouseX, { stiffness: 220, damping: 28, mass: 0.4 });
  const smoothY = useSpring(mouseY, { stiffness: 220, damping: 28, mass: 0.4 });
  const sweep = useMotionTemplate`radial-gradient(circle at ${smoothX}px ${smoothY}px, rgba(0,255,140,0.12), transparent 45%)`;

  function handleMouseMove(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  }

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      whileHover={{ y: -4, scale: 1.015 }}
      transition={{ duration: 0.35, ease: [0.22, 0.61, 0.36, 1] }}
      className="group h-full"
    >
      <Link
        to={`/category/${category.slug}`}
        className={cn(
          'relative flex h-full min-h-[84px] items-center gap-3 overflow-hidden rounded-[20px] border-2 p-3.5 shadow-glass backdrop-blur-glass sm:p-4',
          'transition-[border-color,box-shadow,background-color] duration-[350ms] ease-[cubic-bezier(0.22,0.61,0.36,1)]',
          'bg-white/[0.04]',
          active
            ? 'border-[#00FF7F] shadow-[0_0_18px_rgba(0,255,140,0.35),0_0_40px_rgba(0,255,140,0.20),0_12px_40px_rgba(0,0,0,0.45)]'
            : 'border-white/10 group-hover:border-[#00FF7F] group-hover:shadow-[0_0_18px_rgba(0,255,140,0.35),0_0_40px_rgba(0,255,140,0.20),0_12px_40px_rgba(0,0,0,0.45)]'
        )}
      >
        {/* Background brighten — dark green gradient fades in */}
        <div
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,#02150F_0%,#032A1B_40%,#0A1B17_100%)] transition-opacity duration-[350ms] ease-[cubic-bezier(0.22,0.61,0.36,1)]',
            active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          )}
        />
        {/* Animated radial light sweep — follows the cursor */}
        <motion.div
          aria-hidden="true"
          style={{ background: sweep }}
          className={cn(
            'pointer-events-none absolute inset-0 transition-opacity duration-300',
            active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          )}
        />

        {/* Text — left */}
        <div className="relative z-10 flex min-w-0 flex-1 flex-col">
          <h3
            className={cn(
              'truncate text-[16px] leading-tight transition-all duration-300',
              active
                ? 'font-bold text-[#00FF7F]'
                : 'font-semibold text-white group-hover:font-bold group-hover:text-[#00FF7F]'
            )}
          >
            {category.name}
          </h3>
          {subtitle && (
            <p
              className={cn(
                'mt-1 line-clamp-2 text-[13px] leading-snug transition-all duration-300',
                active
                  ? 'text-emerald-300 opacity-100'
                  : 'text-gray-400 opacity-80 group-hover:text-emerald-300 group-hover:opacity-100'
              )}
            >
              {subtitle}
            </p>
          )}

          {/* Diagonal arrow — animates up-right with a neon glow */}
          <ArrowUpRight
            className={cn(
              'mt-auto pt-3 h-5 w-5 box-content transition-all duration-300 ease-[cubic-bezier(0.22,0.61,0.36,1)]',
              active
                ? '-translate-y-1.5 translate-x-1.5 text-[#00FF7F] drop-shadow-[0_0_8px_rgba(0,255,140,0.8)]'
                : 'text-white/50 group-hover:-translate-y-1.5 group-hover:translate-x-1.5 group-hover:text-[#00FF7F] group-hover:drop-shadow-[0_0_8px_rgba(0,255,140,0.8)]'
            )}
          />
        </div>

        {/* Thumbnail — right */}
        <div className="relative z-10 aspect-square w-[80px] shrink-0 self-center overflow-hidden rounded-xl bg-white/5 sm:w-[92px]">
          {category.thumbnailUrl ? (
            <img
              src={category.thumbnailUrl}
              alt={category.name}
              loading="lazy"
              className={cn(
                'h-full w-full object-cover transition-transform duration-[450ms] ease-out',
                active ? 'scale-[1.06]' : 'group-hover:scale-[1.06]'
              )}
            />
          ) : (
            <div className="h-full w-full bg-[linear-gradient(135deg,#7C3AED,#14B8A6)] opacity-50" />
          )}
        </div>
      </Link>
    </motion.div>
  );
}
