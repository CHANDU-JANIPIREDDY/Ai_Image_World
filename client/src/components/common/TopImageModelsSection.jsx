import { useRef, useState } from 'react';
import {
  motion,
  useMotionValue,
  useMotionTemplate,
  useSpring,
  useAnimationFrame,
  useReducedMotion,
  wrap,
} from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';

import chatgptLogo from '@/assets/logos/chatgpt.svg';
import geminiLogo from '@/assets/logos/gemini.svg';
import midjourneyLogo from '@/assets/logos/midjourney.svg';
import { cn } from '@/utils/cn';

/**
 * Top image-generation models, shown as cards that reuse the exact
 * "Explore by Category" Motion-Sync card styling (mouse-tracked green sweep,
 * neon border + glow, lift, animated diagonal arrow). Each card carries the
 * model's exact brand name, official logo, and a brand-tinted logo tile.
 *
 * - Desktop (sm+): responsive grid, green border on hover.
 * - Mobile: auto-scrolling marquee; the green neon border lights up on the
 *   card passing through the center, then fades as the next one arrives.
 *
 * Drop a real SVG at the matching path in src/assets/logos/ to swap any logo.
 */
const MODELS = [
  {
    name: 'ChatGPT',
    subtitle: 'GPT-4o image generation by OpenAI',
    logo: chatgptLogo,
    url: 'https://chatgpt.com',
    // Brand-tinted logo tile background.
    tile: 'linear-gradient(135deg,#0E8C6D 0%,#10A37F 100%)',
  },
  {
    name: 'Gemini',
    subtitle: 'Imagen image generation by Google',
    logo: geminiLogo,
    url: 'https://gemini.google.com',
    tile: 'linear-gradient(135deg,#1B1F2A 0%,#0E1320 100%)',
  },
  {
    name: 'Midjourney',
    subtitle: 'Artistic image generation',
    logo: midjourneyLogo,
    url: 'https://www.midjourney.com',
    tile: 'linear-gradient(135deg,#111317 0%,#2A2F3A 100%)',
  },
];

/* Marquee drift speed in px/second — slow and premium. */
const SCROLL_SPEED = 36;

export function TopImageModelsSection() {
  return (
    <section className="mx-auto max-w-[90rem] px-0 py-6 sm:px-6 md:py-10">
      {/* Rounded container — site navy gradient with a soft brand glow.
          Full-bleed (square, no side border) on mobile; rounded card on sm+. */}
      <div className="relative overflow-hidden rounded-none border-x-0 border-y border-white/[0.06] bg-[linear-gradient(180deg,#161D33_0%,#0B0F19_100%)] p-4 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.9)] sm:rounded-[24px] sm:border-x sm:p-7">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[radial-gradient(60%_100%_at_50%_0%,rgba(124,58,237,0.18),transparent_70%)]"
        />
        <div className="relative">
          {/* ───────── Header ───────── */}
          <div className="mb-5 flex items-center justify-between sm:mb-6">
            <h2 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
              Top Image Generation Models
            </h2>
          </div>

          {/* Mobile: auto-scrolling marquee with center-activated green border */}
          <div className="sm:hidden">
            <ModelsMarquee />
          </div>

          {/* Desktop: responsive grid (green border on hover) */}
          <div className="hidden gap-4 sm:grid sm:grid-cols-2 lg:grid-cols-3">
            {MODELS.map((model) => (
              <ModelSuiteCard key={model.name} model={model} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * ModelsMarquee — continuously drifting row of compact cards. Whichever card is
 * nearest the viewport center is rendered in the green "active" state, so the
 * neon border appears to travel along with the moving cards. Pauses while the
 * user drags; respects prefers-reduced-motion (static, manually scrollable).
 */
function ModelsMarquee() {
  const reduceMotion = useReducedMotion();
  const x = useMotionValue(0);
  const trackRef = useRef(null);
  const containerRef = useRef(null);
  const cardRefs = useRef([]);
  const wasDragged = useRef(false);
  const [paused, setPaused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  // Duplicate the list for a seamless loop (half the track = one full set).
  const loop = [...MODELS, ...MODELS];

  useAnimationFrame((_, delta) => {
    if (!trackRef.current || !containerRef.current) return;

    // Drift left unless paused / reduced-motion.
    if (!reduceMotion && !paused) {
      const halfWidth = trackRef.current.scrollWidth / 2;
      if (halfWidth > 0) {
        const moveBy = (SCROLL_SPEED * delta) / 1000;
        x.set(wrap(-halfWidth, 0, x.get() - moveBy));
      }
    }

    // Light up whichever card sits closest to the container's horizontal center.
    const cRect = containerRef.current.getBoundingClientRect();
    const center = cRect.left + cRect.width / 2;
    let best = 0;
    let bestDist = Infinity;
    cardRefs.current.forEach((el, i) => {
      if (!el) return;
      const r = el.getBoundingClientRect();
      const dist = Math.abs(r.left + r.width / 2 - center);
      if (dist < bestDist) {
        bestDist = dist;
        best = i;
      }
    });
    setActiveIndex((prev) => (prev === best ? prev : best));
  });

  return (
    <div ref={containerRef} className="relative -my-2 overflow-hidden py-4">
      {/* Edge fades keep the loop seamless. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 z-20 w-10 bg-gradient-to-r from-[#0B0F19] to-transparent"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 z-20 w-10 bg-gradient-to-l from-[#0B0F19] to-transparent"
      />

      <motion.div
        ref={trackRef}
        style={{ x }}
        drag="x"
        dragConstraints={{ left: -10000, right: 10000 }}
        dragElastic={0.04}
        onDragStart={() => {
          wasDragged.current = false;
          setPaused(true);
        }}
        onDrag={(_, info) => {
          if (Math.abs(info.offset.x) > 5) wasDragged.current = true;
        }}
        onDragEnd={() => setPaused(false)}
        className="flex w-max cursor-grab gap-3 will-change-transform active:cursor-grabbing"
      >
        {loop.map((model, i) => (
          <div
            key={`${model.name}-${i}`}
            ref={(el) => (cardRefs.current[i] = el)}
            className="w-[230px] shrink-0"
          >
            <ModelSuiteCard model={model} active={i === activeIndex} wasDragged={wasDragged} />
          </div>
        ))}
      </motion.div>
    </div>
  );
}

/**
 * Model card with the OpenArt "Motion Sync" interaction — identical to the
 * Explore-by-Category card: mouse-tracked radial green sweep, neon border + outer
 * glow, lift, background brighten, logo zoom, neon text, animated diagonal arrow.
 *
 * `active` forces the green state on (used by the mobile marquee for the centered
 * card); on desktop it stays false and the same state is driven by hover.
 */
function ModelSuiteCard({ model, active = false, wasDragged }) {
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
      animate={active ? { y: -4, scale: 1.015 } : { y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: [0.22, 0.61, 0.36, 1] }}
      className="group h-full"
    >
      <a
        href={model.url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Open ${model.name} website`}
        onClick={(e) => {
          // Suppress only the click that ends an actual swipe/drag.
          if (wasDragged?.current) {
            e.preventDefault();
            wasDragged.current = false;
          }
        }}
        className={cn(
          'relative flex h-full min-h-[64px] items-center gap-3 overflow-hidden rounded-[20px] border-2 p-3 shadow-glass backdrop-blur-glass sm:min-h-[84px] sm:p-4',
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
        {/* Static centered green glow when active (no cursor on touch) */}
        <div
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute inset-0 bg-[radial-gradient(60%_80%_at_50%_50%,rgba(0,255,140,0.14),transparent_70%)] transition-opacity duration-300',
            active ? 'opacity-100' : 'opacity-0'
          )}
        />
        {/* Animated radial light sweep — follows the cursor (desktop hover) */}
        <motion.div
          aria-hidden="true"
          style={{ background: sweep }}
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
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
            {model.name}
          </h3>
          <p
            className={cn(
              'mt-1 line-clamp-1 text-[12px] leading-snug transition-all duration-300 sm:line-clamp-2 sm:text-[13px]',
              active
                ? 'text-emerald-300 opacity-100'
                : 'text-gray-400 opacity-80 group-hover:text-emerald-300 group-hover:opacity-100'
            )}
          >
            {model.subtitle}
          </p>

          {/* Diagonal arrow — animates up-right with a neon glow */}
          <ArrowUpRight
            className={cn(
              'mt-auto box-content h-5 w-5 pt-2 transition-all duration-300 ease-[cubic-bezier(0.22,0.61,0.36,1)] sm:pt-3',
              active
                ? '-translate-y-1.5 translate-x-1.5 text-[#00FF7F] drop-shadow-[0_0_8px_rgba(0,255,140,0.8)]'
                : 'text-white/50 group-hover:-translate-y-1.5 group-hover:translate-x-1.5 group-hover:text-[#00FF7F] group-hover:drop-shadow-[0_0_8px_rgba(0,255,140,0.8)]'
            )}
          />
        </div>

        {/* Logo tile — right (brand-tinted, mirrors the category thumbnail) */}
        <div
          className="relative z-10 flex aspect-square w-[64px] shrink-0 self-center items-center justify-center overflow-hidden rounded-xl sm:w-[92px]"
          style={{ background: model.tile }}
        >
          <img
            src={model.logo}
            alt={`${model.name} logo`}
            loading="lazy"
            draggable="false"
            className={cn(
              'h-9 w-9 object-contain transition-transform duration-[450ms] ease-out sm:h-[52px] sm:w-[52px]',
              active ? 'scale-[1.06]' : 'group-hover:scale-[1.06]'
            )}
          />
        </div>
      </a>
    </motion.div>
  );
}

export default TopImageModelsSection;
