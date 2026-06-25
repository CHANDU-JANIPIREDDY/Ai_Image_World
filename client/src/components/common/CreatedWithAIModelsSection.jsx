import { useRef, useState } from 'react';
import { motion, useAnimationFrame, useMotionValue, useReducedMotion, wrap } from 'framer-motion';

import chatgptLogo from '@/assets/logos/chatgpt.svg';
import geminiLogo from '@/assets/logos/gemini.svg';
import midjourneyLogo from '@/assets/logos/midjourney.svg';
import leonardoLogo from '@/assets/logos/leonardo.svg';
import fluxLogo from '@/assets/logos/flux.svg';
import ideogramLogo from '@/assets/logos/ideogram.svg';
import fireflyLogo from '@/assets/logos/firefly.svg';

/* Exact brand names + official logo assets. Drop a real SVG at the matching
   path in src/assets/logos/ to swap any logo — no code change needed. */
const MODELS = [
  { name: 'ChatGPT', logo: chatgptLogo, url: 'https://chatgpt.com' },
  { name: 'Gemini', logo: geminiLogo, url: 'https://gemini.google.com' },
  { name: 'Midjourney', logo: midjourneyLogo, url: 'https://www.midjourney.com' },
  { name: 'Leonardo AI', logo: leonardoLogo, url: 'https://leonardo.ai' },
  { name: 'Flux AI', logo: fluxLogo, url: 'https://flux-ai.io' },
  { name: 'Ideogram', logo: ideogramLogo, url: 'https://ideogram.ai' },
  { name: 'Adobe Firefly', logo: fireflyLogo, url: 'https://firefly.adobe.com' },
];

/* Marquee drift speed in px/second — slow and premium. */
const SCROLL_SPEED = 40;

/** Horizontal glass card: logo left, exact brand name right, vertically centered. */
function ModelCard({ model, wasDragged }) {
  return (
    <motion.a
      href={model.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Open ${model.name} website`}
      onClick={(e) => {
        // Suppress only the click that ends an actual swipe/drag — a plain
        // click (no drag) always opens the link.
        if (wasDragged.current) {
          e.preventDefault();
          wasDragged.current = false;
        }
      }}
      whileHover={{ y: -6 }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      className="group relative block h-[72px] w-[200px] shrink-0 select-none sm:h-[84px] sm:w-[250px] md:h-[96px] md:w-[300px]"
    >
      {/* Green neon glow, revealed on hover. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-1 rounded-[24px] bg-[radial-gradient(circle,rgba(0,255,140,0.35),transparent_70%)] opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-100"
      />

      {/* Animated green border that "loads" around the entire card on hover. */}
      <div
        aria-hidden="true"
        className="neon-loader-border pointer-events-none absolute inset-0 z-20 rounded-[20px] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      />

      {/* Card surface — green glow on hover (Motion-Sync style). */}
      <div className="relative h-full overflow-hidden rounded-[20px] border-2 border-white/10 shadow-glass transition-[box-shadow] duration-[350ms] ease-[cubic-bezier(0.22,0.61,0.36,1)] group-hover:shadow-[0_0_18px_rgba(0,255,140,0.35),0_0_40px_rgba(0,255,140,0.20),0_12px_40px_rgba(0,0,0,0.45)]">
        {/* Background brighten — dark green gradient fades in on hover. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,#02150F_0%,#032A1B_40%,#0A1B17_100%)] opacity-0 transition-opacity duration-[350ms] ease-[cubic-bezier(0.22,0.61,0.36,1)] group-hover:opacity-100"
        />
        {/* Glass surface + content. */}
        <div className="relative z-10 flex h-full items-center gap-3 bg-transparent px-4 backdrop-blur-md sm:gap-4 sm:px-5 md:gap-5 md:px-6">
          <img
            src={model.logo}
            alt={`${model.name} logo`}
            loading="lazy"
            draggable="false"
            className="h-9 w-9 shrink-0 object-contain transition-transform duration-[450ms] ease-out group-hover:scale-[1.08] sm:h-10 sm:w-10 md:h-12 md:w-12"
          />
          <span className="truncate text-sm font-semibold tracking-tight text-content transition-colors duration-300 group-hover:text-[#00FF7F] sm:text-base md:text-xl">
            {model.name}
          </span>
        </div>
      </div>
    </motion.a>
  );
}

/**
 * CreatedWithAIModelsSection — minimal premium marquee of AI models, shown as
 * horizontal glass cards (official logo + exact brand name only).
 *
 * - GPU-accelerated transform via one motion value (60fps, no layout shift).
 * - Pauses on hover and while dragging; touch/swipe friendly.
 * - Respects prefers-reduced-motion (static, scrollable row).
 */
export function CreatedWithAIModelsSection() {
  const reduceMotion = useReducedMotion();
  const x = useMotionValue(0);
  const trackRef = useRef(null);
  const wasDragged = useRef(false);
  const [paused, setPaused] = useState(false);

  // Duplicate the list once for a seamless loop (half the track = one full set).
  const loop = [...MODELS, ...MODELS];

  useAnimationFrame((_, delta) => {
    if (reduceMotion || paused || !trackRef.current) return;
    const halfWidth = trackRef.current.scrollWidth / 2;
    if (halfWidth === 0) return;
    const moveBy = (SCROLL_SPEED * delta) / 1000;
    x.set(wrap(-halfWidth, 0, x.get() - moveBy));
  });

  return (
    <section className="relative overflow-hidden py-10 md:py-14">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <h2 className="gradient-text inline-block pb-1 text-2xl font-semibold leading-snug tracking-tight md:text-4xl md:font-bold">
          Created With AI Models
        </h2>
      </div>

      <div
        className="relative mt-7 md:mt-10"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* Edge fades keep the loop seamless. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-background to-transparent sm:w-28"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-background to-transparent sm:w-28"
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
            // Mark a real drag once the pointer has moved a meaningful distance,
            // so the trailing click is suppressed but plain taps still open links.
            if (Math.abs(info.offset.x) > 5) wasDragged.current = true;
          }}
          onDragEnd={() => setPaused(false)}
          className="flex w-max cursor-grab gap-3 px-4 will-change-transform active:cursor-grabbing sm:gap-4 sm:px-6 md:gap-5"
        >
          {loop.map((model, i) => (
            <ModelCard key={`${model.name}-${i}`} model={model} wasDragged={wasDragged} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}

export default CreatedWithAIModelsSection;
