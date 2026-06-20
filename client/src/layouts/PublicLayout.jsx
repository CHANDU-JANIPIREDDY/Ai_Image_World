import { Suspense, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';

import { Navbar } from '@/components/common/Navbar';
import { Footer } from '@/components/common/Footer';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { Spinner } from '@/components/ui/Spinner';
import { cn } from '@/utils/cn';
import { trackVisit } from '@/utils/analytics';

/** Reset scroll position to the top whenever the route changes. */
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);
  return null;
}

/**
 * PublicLayout — shared chrome for all public pages.
 * Sticky glass navbar, route Outlet (with Suspense for lazy pages), footer.
 */
function PublicLayout() {
  const { pathname } = useLocation();
  // The home page hero runs full-bleed beneath the fixed navbar; every other
  // page needs top padding so its content clears the floating navbar.
  const isHome = pathname === '/';

  // Record a site page view once per app load (POST /analytics/event).
  useEffect(() => {
    trackVisit();
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-background bg-glow-radial">
      <ScrollToTop />
      <Navbar />

      <main className={cn('flex-1', !isHome && 'pt-20')}>
        {/* Keyed by route so a render error on one page clears on navigation. */}
        <ErrorBoundary key={pathname}>
          <Suspense
            fallback={
              <div className="flex min-h-[60vh] items-center justify-center">
                <Spinner size="lg" />
              </div>
            }
          >
            <Outlet />
          </Suspense>
        </ErrorBoundary>
      </main>

      <Footer />
    </div>
  );
}

export default PublicLayout;
