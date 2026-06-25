import { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';

import { cn } from '@/utils/cn';
import { formatCount } from '@/utils/format';
import { useLikeImage, useUnlikeImage } from '@/hooks/useImages';

/**
 * LikeButton — toggle a like on an image and reflect the live count.
 *
 * There are no public user accounts, so the "have I liked this?" state is kept
 * in localStorage keyed by image id. The button is optimistic: the count updates
 * instantly and the server like/unlike call is fire-and-forget. A failed request
 * rolls the optimistic change back.
 */
function LikeButton({ imageId, initialLikes = 0, className }) {
  const storageKey = imageId ? `liked:${imageId}` : null;

  const [liked, setLiked] = useState(() => {
    if (!storageKey || typeof window === 'undefined') return false;
    return window.localStorage.getItem(storageKey) === '1';
  });
  const [count, setCount] = useState(initialLikes);

  const { mutate: like } = useLikeImage();
  const { mutate: unlike } = useUnlikeImage();

  const persist = (isLiked) => {
    if (!storageKey) return;
    if (isLiked) window.localStorage.setItem(storageKey, '1');
    else window.localStorage.removeItem(storageKey);
  };

  const handleToggle = () => {
    if (!imageId) return;
    const next = !liked;

    // Optimistic update.
    setLiked(next);
    setCount((c) => Math.max(0, c + (next ? 1 : -1)));
    persist(next);

    const rollback = () => {
      setLiked(!next);
      setCount((c) => Math.max(0, c + (next ? -1 : 1)));
      persist(!next);
    };

    if (next) like(imageId, { onError: rollback });
    else unlike(imageId, { onError: rollback });
  };

  return (
    <motion.button
      type="button"
      onClick={handleToggle}
      whileTap={{ scale: 0.92 }}
      aria-pressed={liked}
      aria-label={liked ? 'Unlike image' : 'Like image'}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium backdrop-blur-glass transition-colors',
        liked
          ? 'border-rose-400/40 bg-rose-500/15 text-rose-300 hover:bg-rose-500/25'
          : 'border-white/10 bg-white/5 text-content-muted hover:bg-white/10 hover:text-content',
        className
      )}
    >
      <motion.span
        key={liked ? 'on' : 'off'}
        initial={{ scale: 0.6 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 500, damping: 18 }}
        className="inline-flex"
      >
        <Heart className={cn('h-4 w-4', liked && 'fill-current')} />
      </motion.span>
      <span className="tabular-nums">{formatCount(count)}</span>
    </motion.button>
  );
}

export { LikeButton };
