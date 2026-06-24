import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';

import PublicLayout from '@/layouts/PublicLayout';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { Spinner } from '@/components/ui/Spinner';

// Lazy-loaded pages (code-split per route).
const HomePage = lazy(() => import('@/pages/HomePage'));
const CategoriesPage = lazy(() => import('@/pages/CategoriesPage'));
const CategoryDetailPage = lazy(() => import('@/pages/CategoryDetailPage'));
const ImageDetailPage = lazy(() => import('@/pages/ImageDetailPage'));
const SearchPage = lazy(() => import('@/pages/SearchPage'));
const TrendingPage = lazy(() => import('@/pages/TrendingPage'));
const GalleryPage = lazy(() => import('@/pages/GalleryPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

// Auth pages
const SignInPage = lazy(() => import('@/pages/auth/SignInPage'));
const SignUpPage = lazy(() => import('@/pages/auth/SignUpPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage'));

// Admin (dashboard) — code-split behind auth.
const AdminLayout = lazy(() => import('@/layouts/AdminLayout'));
const DashboardOverviewPage = lazy(() => import('@/pages/admin/DashboardOverviewPage'));
const AdminCategoriesPage = lazy(() => import('@/pages/admin/AdminCategoriesPage'));
const AdminImagesPage = lazy(() => import('@/pages/admin/AdminImagesPage'));
const UploadCenterPage = lazy(() => import('@/pages/admin/UploadCenterPage'));
const AnalyticsDashboardPage = lazy(() => import('@/pages/admin/AnalyticsDashboardPage'));
const SearchAnalyticsPage = lazy(() => import('@/pages/admin/SearchAnalyticsPage'));
const SettingsPage = lazy(() => import('@/pages/admin/SettingsPage'));

const PageFallback = (
  <div className="flex min-h-screen items-center justify-center bg-background">
    <Spinner size="lg" />
  </div>
);

/**
 * AppRoutes — public site, standalone auth pages, and the protected /admin tree.
 * Public routes render inside PublicLayout; admin routes require authentication
 * (RequireAuth) and render inside AdminLayout.
 */
function AppRoutes() {
  return (
    <Routes>
      {/* Public site */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/categories" element={<CategoriesPage />} />
        <Route path="/category/:slug" element={<CategoryDetailPage />} />
        <Route path="/image/:slug" element={<ImageDetailPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/trending" element={<TrendingPage />} />
        <Route path="/gallery" element={<GalleryPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      {/* Auth (standalone, no public chrome) */}
      <Route
        path="/signin"
        element={<Suspense fallback={PageFallback}><SignInPage /></Suspense>}
      />
      <Route
        path="/signup"
        element={<Suspense fallback={PageFallback}><SignUpPage /></Suspense>}
      />
      <Route
        path="/forgot-password"
        element={<Suspense fallback={PageFallback}><ForgotPasswordPage /></Suspense>}
      />

      {/* Admin dashboard (protected) */}
      <Route element={<RequireAuth />}>
        <Route
          path="/admin"
          element={<Suspense fallback={PageFallback}><AdminLayout /></Suspense>}
        >
          <Route index element={<DashboardOverviewPage />} />
          <Route path="categories" element={<AdminCategoriesPage />} />
          <Route path="images" element={<AdminImagesPage />} />
          <Route path="upload" element={<UploadCenterPage />} />
          <Route path="analytics" element={<AnalyticsDashboardPage />} />
          <Route path="search-analytics" element={<SearchAnalyticsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default AppRoutes;
