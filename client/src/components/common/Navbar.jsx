import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, X, ChevronDown, TrendingUp } from 'lucide-react';

import { cn } from '@/utils/cn';
import { SearchBar } from './SearchBar';
import { useCategories } from '@/hooks/useCategories';

const navLinkClass = ({ isActive }) =>
  cn(
    'text-sm transition-colors',
    isActive ? 'text-content' : 'text-content-muted hover:text-content'
  );

function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { data } = useCategories({ active: true });
  const categories = (data?.data || []).slice(0, 8);

  // Transparent over the hero video at the top of the page; glass once scrolled
  // (or whenever the mobile menu is open, so its panel stays legible).
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const solid = scrolled || mobileOpen;

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 border-b border-white/10 transition-all duration-300',
        // Always transparent — never a solid fill. A faint backdrop-blur once
        // scrolled keeps links legible over busy content below the hero.
        solid ? 'backdrop-blur-md' : 'bg-transparent'
      )}
    >
      <nav className="mx-auto flex max-w-[1600px] items-center gap-4 px-6 py-3 lg:px-10">
        {/* Logo */}
        <Link to="/" className="shrink-0 text-lg font-bold tracking-tight text-white">
          <span className="bg-brand-gradient bg-clip-text text-transparent">◆</span>{' '}
          <span className="bg-brand-gradient bg-clip-text font-extrabold text-transparent">AI</span>&nbsp; Image World
        </Link>

        {/* Desktop links */}
        <div className="ml-6 hidden items-center gap-6 md:flex">
          <NavLink to="/" end className={navLinkClass}>
            Home
          </NavLink>

          {/* Categories dropdown */}
          <div
            className="relative"
            onMouseEnter={() => setCatOpen(true)}
            onMouseLeave={() => setCatOpen(false)}
          >
            <button
              type="button"
              className="inline-flex items-center gap-1 text-sm text-content-muted transition-colors hover:text-content"
              aria-haspopup="true"
              aria-expanded={catOpen}
            >
              Categories <ChevronDown className="h-4 w-4" />
            </button>
            <AnimatePresence>
              {catOpen && categories.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 top-full w-56 rounded-2xl glass-panel p-2"
                >
                  {categories.map((c) => (
                    <Link
                      key={c._id || c.id || c.slug}
                      to={`/category/${c.slug}`}
                      className="block rounded-xl px-3 py-2 text-sm text-content-muted transition-colors hover:bg-white/5 hover:text-content"
                    >
                      {c.name}
                    </Link>
                  ))}
                  <Link
                    to="/categories"
                    className="mt-1 block rounded-xl px-3 py-2 text-sm font-medium text-primary hover:bg-white/5"
                  >
                    View all →
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <NavLink to="/search?q=trending" className={navLinkClass}>
            <span className="inline-flex items-center gap-1">
              <TrendingUp className="h-4 w-4" /> Trending
            </span>
          </NavLink>
        </div>

        {/* Right group: search + auth (desktop) */}
        <div className="ml-auto hidden items-center gap-3 md:flex">
          <div className="w-64 lg:w-72">
            <SearchBar />
          </div>
          <Link
            to="/signin"
            className="inline-flex h-11 items-center rounded-xl border border-white/15 bg-white/5 px-4 text-sm font-medium text-white transition-colors hover:bg-white/10"
          >
            Sign In
          </Link>
          <Link
            to="/signup"
            className="inline-flex h-11 items-center rounded-xl bg-primary px-4 text-sm font-medium text-white transition-all hover:bg-primary-hover hover:shadow-glow"
          >
            Sign Up
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          type="button"
          className="ml-auto inline-flex h-10 w-10 items-center justify-center rounded-xl text-content md:hidden"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-white/10 bg-background/90 backdrop-blur-md md:hidden"
          >
            <div className="space-y-3 px-4 py-4">
              <SearchBar />
              <div className="flex flex-col gap-1" onClick={() => setMobileOpen(false)}>
                <NavLink to="/" end className="rounded-xl px-3 py-2 text-content-muted hover:bg-white/5">
                  Home
                </NavLink>
                <NavLink to="/categories" className="rounded-xl px-3 py-2 text-content-muted hover:bg-white/5">
                  Categories
                </NavLink>
                <NavLink to="/search?q=trending" className="rounded-xl px-3 py-2 text-content-muted hover:bg-white/5">
                  Trending
                </NavLink>
              </div>
              <div className="flex gap-3 pt-1" onClick={() => setMobileOpen(false)}>
                <Link
                  to="/signin"
                  className="inline-flex h-11 flex-1 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-sm font-medium text-white hover:bg-white/10"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="inline-flex h-11 flex-1 items-center justify-center rounded-xl bg-primary text-sm font-medium text-white hover:bg-primary-hover"
                >
                  Sign Up
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

export { Navbar };
