import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { RotateCcw, ArrowRight, Sparkles, Copy, LayoutGrid } from 'lucide-react';

import { useTrendingImages } from '@/hooks/useImages';
import { Skeleton } from '@/components/ui/Skeleton';

/* How many cards to stack in the deck. */
const DECK_SIZE = 8;
/* Pull a larger pool so each reset can draw a different set of images. */
const POOL_SIZE = 30;

/* Return a new array of `n` items randomly sampled from `pool`. */
function sample(pool, n) {
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

/**
 * One draggable card. The front card can be swiped left/right; cards behind it
 * are fanned with a small rotation and sit slightly scaled back.
 *
 * Visual layers (front card): floating ambient light, animated gradient border,
 * neon hover glow, cursor-driven 3D tilt, and a glass reflection sweep.
 */
function SwipeCard({ image, index, isFront, onSwipe }) {
  const x = useMotionValue(0);

  const rotateRaw = useTransform(x, [-150, 150], [-18, 18]);
  const opacity = useTransform(x, [-150, 0, 150], [0, 1, 0]);

  // Fan the non-front cards slightly to the left/right.
  const offset = isFront ? 0 : index % 2 ? 6 : -6;
  const rotate = useTransform(rotateRaw, (latest) => `${latest + offset}deg`);

  // Cursor-driven 3D tilt (front card only), smoothed with a spring.
  const tiltX = useMotionValue(0);
  const tiltY = useMotionValue(0);
  const sx = useSpring(tiltX, { stiffness: 250, damping: 18 });
  const sy = useSpring(tiltY, { stiffness: 250, damping: 18 });
  const rotateY = useTransform(sx, [-0.5, 0.5], [-10, 10]);
  const rotateX = useTransform(sy, [-0.5, 0.5], [10, -10]);

  const handleTilt = (e) => {
    if (!isFront) return;
    const r = e.currentTarget.getBoundingClientRect();
    tiltX.set((e.clientX - r.left) / r.width - 0.5);
    tiltY.set((e.clientY - r.top) / r.height - 0.5);
  };
  const resetTilt = () => {
    tiltX.set(0);
    tiltY.set(0);
  };

  const src = image.thumbnailUrl || image.imageUrl;

  const handleDragEnd = () => {
    if (Math.abs(x.get()) > 50) onSwipe(image);
  };

  return (
    <motion.div
      aria-label={image.title}
      onMouseMove={handleTilt}
      onMouseLeave={resetTilt}
      className="group h-80 w-60 origin-bottom touch-none select-none [transform-style:preserve-3d] hover:cursor-grab active:cursor-grabbing sm:h-96 sm:w-72"
      style={{
        gridRow: 1,
        gridColumn: 1,
        x,
        opacity,
        rotate,
        rotateX: isFront ? rotateX : 0,
        rotateY: isFront ? rotateY : 0,
        zIndex: isFront ? DECK_SIZE + 1 : index,
        pointerEvents: isFront ? 'auto' : 'none',
      }}
      animate={{ scale: isFront ? 1 : 0.98 }}
      whileHover={isFront ? { scale: 1.03 } : undefined}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      drag={isFront ? 'x' : false}
      dragMomentum={false}
      dragSnapToOrigin
      onDragEnd={handleDragEnd}
    >
      {/* Floating ambient light behind the active card. */}
      {isFront && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-6 -z-10 rounded-[36px] bg-[radial-gradient(circle_at_50%_40%,rgba(139,92,246,0.45),rgba(6,182,212,0.25)_45%,transparent_70%)] opacity-60 blur-2xl transition-opacity duration-300 animate-ambient-pulse group-hover:opacity-100"
        />
      )}

      {/* Animated Purple→Cyan gradient border, revealed on hover. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-px rounded-[18px] bg-neon-gradient bg-[length:300%_300%] opacity-0 transition-opacity duration-300 animate-gradient-shift group-hover:opacity-100"
      />

      {/* Image surface — rounded, clipped, with neon hover shadow. */}
      <div
        className={
          'relative h-full w-full overflow-hidden rounded-2xl border border-white/10 bg-surface bg-cover bg-center shadow-glass transition-shadow duration-300 ' +
          (isFront
            ? 'group-hover:shadow-[0_0_50px_rgba(139,92,246,0.5),0_0_90px_rgba(6,182,212,0.3)]'
            : '')
        }
        style={{ backgroundImage: `url(${src})` }}
      >
        {/* Glass reflection sweep on hover. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -translate-x-full -skew-x-12 bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full"
        />

        {/* Title strip at the bottom of the card. */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent p-4">
          <h3 className="line-clamp-1 text-sm font-medium text-white">{image.title}</h3>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * SwipeImageCards — an interactive, swipeable deck of our trending images.
 * Drag the top card past the threshold to dismiss it; reset to restore the deck.
 */
export function SwipeImageCards() {
  const { data, isLoading, isError } = useTrendingImages({ limit: POOL_SIZE });
  const pool = data?.data ?? [];

  const [cards, setCards] = useState([]);

  // Seed the deck with a random sample whenever the trending images arrive.
  useEffect(() => {
    setCards(sample(pool, DECK_SIZE));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const idOf = (img) => img._id || img.id;

  const handleSwipe = (image) => {
    setCards((pv) => pv.filter((c) => idOf(c) !== idOf(image)));
  };

  // Draw a fresh random set so the images change on every reset.
  const reset = () => setCards(sample(pool, DECK_SIZE));

  // Don't render the section at all if there's nothing to show.
  if (!isLoading && !isError && pool.length === 0) return null;

  const frontId = cards.length ? idOf(cards[cards.length - 1]) : null;

  return (
    <section className="relative overflow-hidden py-10 md:py-14">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-6 md:grid-cols-2 md:gap-12">
        {/* Left — the swipeable deck (centered on mobile, no text). */}
        <div className="grid h-[380px] w-full place-items-center [perspective:1200px] sm:h-[440px]">
          {isLoading ? (
            <Skeleton className="h-80 w-60 rounded-2xl sm:h-96 sm:w-72" />
          ) : (
            <>
              {cards.map((image, index) => (
                <SwipeCard
                  key={idOf(image)}
                  image={image}
                  index={index}
                  isFront={idOf(image) === frontId}
                  onSwipe={handleSwipe}
                />
              ))}

              {cards.length === 0 && (
                <button
                  type="button"
                  onClick={reset}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-content backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/10 hover:shadow-[0_8px_30px_rgba(139,92,246,0.4)]"
                >
                  <RotateCcw className="h-4 w-4" /> Reset deck
                </button>
              )}
            </>
          )}
        </div>

        {/* Right — website copy. Hidden on mobile, where only the deck shows. */}
        <div className="hidden md:block">
          {/* Premium glass badge above the heading. */}
          <span className="group/badge inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.18em] text-white/85 backdrop-blur-md shadow-[0_0_24px_rgba(139,92,246,0.3)] transition-colors duration-300 hover:border-white/25">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#06B6D4] opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4]" />
            </span>
            AI Image World
          </span>

          <h2 className="mt-5 text-3xl font-bold leading-[1.1] tracking-tight text-white md:text-4xl lg:text-5xl">
            Swipe to{' '}
            <span className="bg-gradient-to-r from-[#8B5CF6] via-[#A855F7] to-[#06B6D4] bg-clip-text text-transparent">
              Explore
            </span>
          </h2>
          <p className="mt-4 w-full text-sm leading-relaxed text-slate-300/90 lg:text-base">
            Step into a living gallery of stunning, AI-generated art. Flick through
            trending creations, discover the styles you love, and copy
            production-ready prompts in a single click.
          </p>

          {/* Feature rows — glass icon chips with neon accents. */}
          <ul className="mt-7 space-y-4">
            {[
              {
                Icon: Sparkles,
                title: 'Curated, refreshed daily',
                desc: 'Thousands of hand-picked AI images, always fresh.',
                from: 'from-[#8B5CF6]',
                to: 'to-[#06B6D4]',
              },
              {
                Icon: Copy,
                title: 'Copy-ready prompts',
                desc: 'Grab the exact prompt behind any artwork in one tap.',
                from: 'from-[#06B6D4]',
                to: 'to-[#A855F7]',
              },
              {
                Icon: LayoutGrid,
                title: 'Browse your way',
                desc: 'Explore by category, trend, and the latest drops.',
                from: 'from-[#A855F7]',
                to: 'to-[#8B5CF6]',
              },
            ].map(({ Icon, title, desc, from, to }) => (
              <li key={title} className="group/feat flex items-start gap-3.5">
                <span
                  className={
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-br ' +
                    from +
                    ' ' +
                    to +
                    ' bg-opacity-20 text-white shadow-[0_0_18px_rgba(139,92,246,0.35)] transition-transform duration-300 group-hover/feat:scale-110'
                  }
                >
                  <Icon className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">{title}</p>
                  <p className="text-sm text-slate-400">{desc}</p>
                </div>
              </li>
            ))}
          </ul>

          {/* Stats strip. */}
          <div className="mt-7 flex items-center gap-6">
            <div>
              <p className="bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] bg-clip-text text-2xl font-bold text-transparent">
                10K+
              </p>
              <p className="text-xs uppercase tracking-wide text-slate-400">Images</p>
            </div>
            <span className="h-8 w-px bg-white/10" />
            <div>
              <p className="bg-gradient-to-r from-[#06B6D4] to-[#A855F7] bg-clip-text text-2xl font-bold text-transparent">
                7+
              </p>
              <p className="text-xs uppercase tracking-wide text-slate-400">AI Models</p>
            </div>
            <span className="h-8 w-px bg-white/10" />
            <div>
              <p className="bg-gradient-to-r from-[#A855F7] to-[#8B5CF6] bg-clip-text text-2xl font-bold text-transparent">
                Daily
              </p>
              <p className="text-xs uppercase tracking-wide text-slate-400">Updates</p>
            </div>
          </div>

          {/* CTA pair — animated gradient button + secondary text link. */}
          <div className="mt-8 flex items-center gap-5">
            <Link
              to="/gallery"
              className="group/btn relative inline-flex items-center gap-2 overflow-hidden rounded-full px-6 py-3 text-sm font-semibold text-white shadow-[0_8px_30px_rgba(139,92,246,0.45)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_44px_rgba(6,182,212,0.5)]"
            >
              <span
                aria-hidden="true"
                className="absolute inset-0 -z-10 bg-neon-gradient bg-[length:300%_300%] animate-gradient-shift"
              />
              Explore the gallery
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
            </Link>
            <Link
              to="/categories"
              className="group/link inline-flex items-center gap-1.5 text-sm font-medium text-slate-300 transition-colors duration-300 hover:text-white"
            >
              Browse categories
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover/link:translate-x-1" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default SwipeImageCards;
