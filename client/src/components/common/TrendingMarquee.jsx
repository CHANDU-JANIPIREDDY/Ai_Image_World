import { useEffect, useRef } from 'react';

import { ImageCard } from './ImageCard';

/**
 * TrendingMarquee — horizontal "Trending Now" row.
 *
 * On mobile it auto-scrolls slowly and loops back to the start; on desktop
 * (md+) it stays a normal manual-scroll row. Auto-scroll pauses while the user
 * is touching / scrolling the row and resumes a couple seconds later, and is
 * fully disabled when the OS "reduce motion" preference is set.
 */
function TrendingMarquee({ images }) {
  const trackRef = useRef(null);
  const pausedRef = useRef(false);
  const posRef = useRef(0);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return undefined;

    const isDesktop = window.matchMedia('(min-width: 768px)'); // Tailwind md
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const SPEED = 0.18; // px per frame ≈ 11px/s — a slow drift

    let raf;
    let resumeTimer;
    posRef.current = el.scrollLeft;

    const tick = () => {
      if (!pausedRef.current && !isDesktop.matches && !reduceMotion.matches) {
        const max = el.scrollWidth - el.clientWidth;
        if (max > 1) {
          posRef.current = posRef.current >= max ? 0 : posRef.current + SPEED;
          el.scrollLeft = posRef.current;
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    // Pause on interaction; resume (synced to wherever the user left off) later.
    const pause = () => {
      pausedRef.current = true;
      clearTimeout(resumeTimer);
      resumeTimer = setTimeout(() => {
        posRef.current = el.scrollLeft;
        pausedRef.current = false;
      }, 2000);
    };

    el.addEventListener('touchstart', pause, { passive: true });
    el.addEventListener('pointerdown', pause);
    el.addEventListener('wheel', pause, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(resumeTimer);
      el.removeEventListener('touchstart', pause);
      el.removeEventListener('pointerdown', pause);
      el.removeEventListener('wheel', pause);
    };
  }, [images]);

  return (
    <div
      ref={trackRef}
      className="no-scrollbar -mx-2 flex gap-4 overflow-x-auto px-2 pb-2"
    >
      {images.map((image) => (
        <ImageCard
          key={image._id || image.id}
          image={image}
          className="trending-card w-44 shrink-0 sm:w-52"
        />
      ))}
    </div>
  );
}

export { TrendingMarquee };
