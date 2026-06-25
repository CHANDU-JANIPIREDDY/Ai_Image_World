import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, X, ChevronDown, TrendingUp, Home, LayoutGrid, ChevronRight } from 'lucide-react';

import { cn } from '@/utils/cn';
import { SearchBar } from './SearchBar';
import { useCategories } from '@/hooks/useCategories';

const navLinkClass = ({ isActive }) =>
  cn(
    'text-sm transition-colors',
    isActive ? 'text-content' : 'text-content-muted hover:text-content'
  );

// Primary links for the mobile drawer (with icons + active highlight).
const MOBILE_LINKS = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/categories', label: 'Categories', icon: LayoutGrid },
  { to: '/search?q=trending', label: 'Trending', icon: TrendingUp },
];

const mobileLinkClass = ({ isActive }) =>
  cn(
    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium transition-colors',
    isActive
      ? 'bg-primary/15 text-white ring-1 ring-primary/30'
      : 'text-content-muted hover:bg-white/5 hover:text-content'
  );

// Staggered entrance for the drawer items.
const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.05 } },
};
const itemVariants = {
  hidden: { opacity: 0, x: -12 },
  show: { opacity: 1, x: 0, transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] } },
};

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

  // Lock body scroll while the mobile drawer is open.
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

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
          className="ml-auto inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-content transition-colors hover:bg-white/10 md:hidden"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
        >
          <AnimatePresence mode="wait" initial={false}>
            {mobileOpen ? (
              <motion.span
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <X className="h-6 w-6" />
              </motion.span>
            ) : (
              <motion.span
                key="open"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <Menu className="h-6 w-6" />
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Dim backdrop — tap to close */}
            <motion.button
              type="button"
              aria-label="Close menu"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 top-[var(--nav-h,64px)] z-40 bg-black/50 backdrop-blur-sm md:hidden"
            />

            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="relative z-50 overflow-hidden border-t border-white/10 bg-background/95 backdrop-blur-xl md:hidden"
            >
              <motion.div
                variants={listVariants}
                initial="hidden"
                animate="show"
                className="max-h-[calc(100vh-64px)] space-y-4 overflow-y-auto px-4 pb-6 pt-4"
              >
                <motion.div variants={itemVariants}>
                  <SearchBar />
                </motion.div>

                {/* Primary links */}
                <div className="flex flex-col gap-1.5" onClick={() => setMobileOpen(false)}>
                  {MOBILE_LINKS.map(({ to, label, icon: Icon, end }) => (
                    <motion.div key={to} variants={itemVariants}>
                      <NavLink to={to} end={end} className={mobileLinkClass}>
                        <Icon className="h-[18px] w-[18px] shrink-0" />
                        <span>{label}</span>
                        <ChevronRight className="ml-auto h-4 w-4 opacity-40" />
                      </NavLink>
                    </motion.div>
                  ))}
                </div>

                {/* Auth actions */}
                <motion.div
                  variants={itemVariants}
                  className="flex gap-3 border-t border-white/10 pt-4"
                  onClick={() => setMobileOpen(false)}
                >
                  <Link
                    to="/signin"
                    className="inline-flex h-11 flex-1 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-sm font-medium text-white hover:bg-white/10"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/signup"
                    className="inline-flex h-11 flex-1 items-center justify-center rounded-xl bg-primary text-sm font-medium text-white transition-all hover:bg-primary-hover hover:shadow-glow"
                  >
                    Sign Up
                  </Link>
                </motion.div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}

export { Navbar };
