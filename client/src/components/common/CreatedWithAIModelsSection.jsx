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
function ModelCard({ model, x, dragStartX }) {
  return (
    <motion.a
      href={model.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Open ${model.name} website`}
      onClick={(e) => {
        // Suppress the click that fires at the end of a swipe/drag.
        if (Math.abs(x.get() - dragStartX.current) > 4) e.preventDefault();
      }}
      whileHover={{ y: -6 }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      className="group relative block h-[96px] w-[300px] shrink-0 select-none"
    >
      {/* Subtle glow, revealed on hover. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-1 rounded-[24px] bg-brand-gradient opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-30"
      />

      {/* Gradient soft border. */}
      <div className="relative h-full rounded-[20px] bg-gradient-to-br from-white/15 to-white/5 p-px shadow-glass transition-shadow duration-500 group-hover:shadow-glow">
        {/* Clear transparent glass surface. */}
        <div className="flex h-full items-center gap-5 rounded-[19px] bg-white/[0.02] px-6 backdrop-blur-md transition-colors duration-500 group-hover:bg-white/[0.06]">
          <img
            src={model.logo}
            alt={`${model.name} logo`}
            loading="lazy"
            draggable="false"
            className="h-12 w-12 shrink-0 object-contain"
          />
          <span className="text-base font-semibold tracking-tight text-content md:text-xl">{model.name}</span>
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
  const dragStartX = useRef(0);
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
            dragStartX.current = x.get();
            setPaused(true);
          }}
          onDragEnd={() => setPaused(false)}
          className="flex w-max cursor-grab gap-5 px-6 will-change-transform active:cursor-grabbing"
        >
          {loop.map((model, i) => (
            <ModelCard key={`${model.name}-${i}`} model={model} x={x} dragStartX={dragStartX} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}

export default CreatedWithAIModelsSection;
