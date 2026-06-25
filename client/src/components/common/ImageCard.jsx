import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, Copy, Heart } from 'lucide-react';

import { cn } from '@/utils/cn';
import { formatCount } from '@/utils/format';

/**
 * ImageCard — masonry tile linking to the image detail page.
 * Hover: lift + image zoom + info overlay. Image lazy-loads with a skeleton.
 */
function ImageCard({ image, className, onClick }) {
  const [loaded, setLoaded] = useState(false);
  const slug = image.slug;
  const src = image.thumbnailUrl || image.imageUrl;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={cn('group relative overflow-hidden rounded-2xl border border-white/10 bg-surface', className)}
    >
      <Link to={`/image/${slug}`} aria-label={image.title} onClick={onClick} className="block">
        {/* Skeleton placeholder until the image loads */}
        {!loaded && <div className="aspect-[3/4] w-full animate-pulse bg-white/5" />}

        <img
          src={src}
          alt={image.title}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          className={cn(
            'w-full object-cover transition-transform duration-300 group-hover:scale-105',
            !loaded && 'absolute inset-0 opacity-0'
          )}
        />

        {/* Hover overlay */}
        <div className="pointer-events-none absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-black/20 to-transparent p-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <h3 className="line-clamp-1 text-sm font-medium text-white">{image.title}</h3>
          <div className="mt-1 flex items-center gap-3 text-xs text-white/80">
            <span className="inline-flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" /> {formatCount(image.views)}
            </span>
            <span className="inline-flex items-center gap-1">
              <Copy className="h-3.5 w-3.5" /> {formatCount(image.promptCopyCount)}
            </span>
            <span className="inline-flex items-center gap-1">
              <Heart className="h-3.5 w-3.5" /> {formatCount(image.likes)}
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export { ImageCard };
