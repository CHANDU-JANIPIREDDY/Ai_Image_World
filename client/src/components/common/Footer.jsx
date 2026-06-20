import { Link } from 'react-router-dom';
import { Github, Twitter, Instagram } from 'lucide-react';

import { useCategories } from '@/hooks/useCategories';

const SOCIALS = [
  { Icon: Twitter, href: 'https://twitter.com', label: 'Twitter' },
  { Icon: Instagram, href: 'https://instagram.com', label: 'Instagram' },
  { Icon: Github, href: 'https://github.com', label: 'GitHub' },
];

function Footer() {
  const { data } = useCategories({ active: true });
  const categories = (data?.data || []).slice(0, 5);
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t border-white/10 bg-surface/50">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-12 sm:grid-cols-2 md:grid-cols-4">
        {/* Brand */}
        <div className="sm:col-span-2 md:col-span-1">
          <span className="text-lg font-bold gradient-text">◆ AI Image World</span>
          <p className="mt-3 max-w-xs text-sm text-content-muted">
            Discover AI-generated art and copy the prompts behind every image.
          </p>
        </div>

        {/* Quick links */}
        <div>
          <h4 className="mb-3 text-sm font-semibold text-content">Explore</h4>
          <ul className="space-y-2 text-sm text-content-muted">
            <li><Link to="/" className="hover:text-content">Home</Link></li>
            <li><Link to="/categories" className="hover:text-content">Categories</Link></li>
            <li><Link to="/search?q=trending" className="hover:text-content">Trending</Link></li>
          </ul>
        </div>

        {/* Categories */}
        <div>
          <h4 className="mb-3 text-sm font-semibold text-content">Categories</h4>
          <ul className="space-y-2 text-sm text-content-muted">
            {categories.length === 0 && <li className="text-content-muted/60">—</li>}
            {categories.map((c) => (
              <li key={c._id || c.id || c.slug}>
                <Link to={`/category/${c.slug}`} className="hover:text-content">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Social */}
        <div>
          <h4 className="mb-3 text-sm font-semibold text-content">Follow</h4>
          <div className="flex gap-3">
            {SOCIALS.map(({ Icon, href, label }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="flex h-9 w-9 items-center justify-center rounded-xl glass-panel text-content-muted transition-colors hover:text-content"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 py-4 text-center text-xs text-content-muted">
        © {year} AI Image World. All rights reserved.
      </div>
    </footer>
  );
}

export { Footer };
