import { Link } from 'react-router-dom';
import { KeyRound } from 'lucide-react';

import { Seo } from '@/components/common/Seo';
import { AuthShell } from '@/components/auth/AuthShell';
import { Button } from '@/components/ui/Button';

/**
 * ForgotPasswordPage — the backend has no password-reset endpoint (admin auth
 * only). Password changes are done while signed in via PUT /auth/change-password
 * (available in Settings), or reset by a superadmin. This page explains that
 * rather than calling a non-existent API.
 */
export default function ForgotPasswordPage() {
  return (
    <>
      <Seo title="Forgot Password" />
      <AuthShell
        title="Reset your password"
        subtitle="Password resets are handled by an administrator."
        footer={
          <Link to="/signin" className="hover:text-content">
            Back to Sign In
          </Link>
        }
      >
        <div className="space-y-4 text-sm text-content-muted">
          <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
            <KeyRound className="mt-0.5 h-5 w-5 shrink-0 text-secondary" />
            <p>
              There is no public password-reset flow. If you&apos;re locked out, ask a
              superadmin to reset your password. Once signed in, you can change it
              anytime from <span className="text-content">Settings → Change Password</span>{' '}
              (PUT /auth/change-password).
            </p>
          </div>
          <Link to="/signin" className="block">
            <Button className="w-full" size="lg">
              Back to Sign In
            </Button>
          </Link>
        </div>
      </AuthShell>
    </>
  );
}
