import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { useAuth } from '@/contexts/AuthContext';
import { Spinner } from '@/components/ui/Spinner';

/**
 * RequireAuth — route guard for the admin area. While the session is being
 * restored it shows a spinner; unauthenticated users are redirected to
 * /signin (preserving where they came from so login can return them).
 */
export function RequireAuth() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
