import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

import { cn } from '@/utils/cn';
import { formatCount } from '@/utils/format';

/**
 * CategoryCard — thumbnail tile linking to a category page.
 */
function CategoryCard({ category, className }) {
  return (
    <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.2 }}>
      <Link
        to={`/category/${category.slug}`}
        className={cn(
          'group relative block aspect-[4/3] overflow-hidden rounded-2xl border border-white/10 bg-surface',
          className
        )}
      >
        {category.thumbnailUrl ? (
          <img
            src={category.thumbnailUrl}
            alt={category.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full bg-brand-gradient opacity-40" />
        )}

        <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 to-transparent p-3">
          <h3 className="font-semibold text-white">{category.name}</h3>
          {typeof category.imageCount === 'number' && (
            <span className="text-xs text-white/70">{formatCount(category.imageCount)} images</span>
          )}
        </div>
      </Link>
    </motion.div>
  );
}

export { CategoryCard };
