import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';

import { Seo } from '@/components/common/Seo';
import { AuthShell } from '@/components/auth/AuthShell';
import { Button } from '@/components/ui/Button';

/**
 * SignUpPage — AI Image World uses invite-only admin accounts; there is no
 * public self-registration endpoint in the backend (auth is admin-login only).
 * This page is intentionally informational rather than wiring a non-existent
 * API. New admin/editor accounts are provisioned by a superadmin.
 */
export default function SignUpPage() {
  return (
    <>
      <Seo title="Create Account" />
      <AuthShell
        title="Accounts are invite-only"
        subtitle="AI Image World admin access is provisioned by a superadmin."
        footer={
          <Link to="/signin" className="hover:text-content">
            Already have an account? Sign in
          </Link>
        }
      >
        <div className="space-y-4 text-sm text-content-muted">
          <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-secondary" />
            <p>
              The backend exposes only admin authentication — there is no public
              registration endpoint. To get an account, ask a superadmin to create one
              for you (role: admin or editor), then sign in.
            </p>
          </div>
          <Link to="/signin" className="block">
            <Button className="w-full" size="lg">
              Go to Sign In
            </Button>
          </Link>
        </div>
      </AuthShell>
    </>
  );
}
