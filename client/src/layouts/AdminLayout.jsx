import { Suspense, useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderTree,
  Images as ImagesIcon,
  Upload,
  BarChart3,
  Search,
  Settings as SettingsIcon,
  LogOut,
  Menu,
  X,
  ExternalLink,
} from 'lucide-react';

import { cn } from '@/utils/cn';
import { useAuth } from '@/contexts/AuthContext';
import { Spinner } from '@/components/ui/Spinner';

const NAV = [
  { to: '/admin', end: true, label: 'Overview', icon: LayoutDashboard },
  { to: '/admin/categories', label: 'Categories', icon: FolderTree },
  { to: '/admin/images', label: 'Images', icon: ImagesIcon },
  { to: '/admin/upload', label: 'Upload Center', icon: Upload },
  { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/admin/search-analytics', label: 'Search Analytics', icon: Search },
  { to: '/admin/settings', label: 'Settings', icon: SettingsIcon },
];

function NavItems({ onNavigate }) {
  return (
    <nav className="flex flex-col gap-1">
      {NAV.map(({ to, end, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors',
              isActive
                ? 'bg-primary/20 text-content'
                : 'text-content-muted hover:bg-white/5 hover:text-content'
            )
          }
        >
          <Icon className="h-4.5 w-4.5" />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}

/**
 * AdminLayout — dashboard chrome: fixed sidebar (desktop) / drawer (mobile),
 * a top bar with the signed-in admin + logout, and the routed Outlet.
 */
export default function AdminLayout() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background bg-glow-radial text-content">
      {/* Sidebar (desktop) */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-white/10 bg-surface/60 p-4 backdrop-blur-md lg:flex">
        <Link to="/admin" className="mb-6 px-2 text-lg font-bold gradient-text">
          ◆ AIW Admin
        </Link>
        <NavItems />
        <div className="mt-auto">
          <Link
            to="/"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-content-muted transition-colors hover:bg-white/5 hover:text-content"
          >
            <ExternalLink className="h-4.5 w-4.5" /> View site
          </Link>
        </div>
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col border-r border-white/10 bg-surface p-4">
            <div className="mb-6 flex items-center justify-between px-2">
              <span className="text-lg font-bold gradient-text">◆ AIW Admin</span>
              <button onClick={() => setOpen(false)} aria-label="Close menu">
                <X className="h-5 w-5" />
              </button>
            </div>
            <NavItems onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main column */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-white/10 bg-background/80 px-4 py-3 backdrop-blur-md sm:px-6">
          <button
            className="lg:hidden"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="ml-auto flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium leading-tight">{user?.name || 'Admin'}</p>
              <p className="text-xs text-content-muted">{user?.email}</p>
            </div>
            <button
              onClick={logout}
              className="inline-flex h-9 items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 text-sm text-content transition-colors hover:bg-white/10"
            >
              <LogOut className="h-4 w-4" /> Logout
            </button>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <Suspense
            fallback={
              <div className="flex min-h-[60vh] items-center justify-center">
                <Spinner size="lg" />
              </div>
            }
          >
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
