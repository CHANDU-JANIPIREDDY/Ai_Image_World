import { Link } from 'react-router-dom';

/**
 * AuthShell — centered glass card used by the sign-in / sign-up / forgot pages.
 */
export function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background bg-glow-radial px-6 py-16">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 block text-center text-xl font-bold gradient-text">
          ◆ AI Image World
        </Link>

        <div className="rounded-3xl glass-panel p-8">
          <h1 className="text-2xl font-bold text-content">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-content-muted">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>

        {footer && <div className="mt-6 text-center text-sm text-content-muted">{footer}</div>}
      </div>
    </div>
  );
}
