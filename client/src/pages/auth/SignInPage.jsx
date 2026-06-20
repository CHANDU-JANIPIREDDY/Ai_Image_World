import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';

import { Seo } from '@/components/common/Seo';
import { AuthShell } from '@/components/auth/AuthShell';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';

/**
 * SignInPage — admin login (POST /auth/login). On success the user is sent to
 * wherever they were headed (or /admin), and the session is established in
 * AuthContext.
 */
export default function SignInPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/admin';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Seo title="Sign In" />
      <AuthShell
        title="Admin Sign In"
        subtitle="Sign in to manage AI Image World."
        footer={
          <>
            <Link to="/forgot-password" className="hover:text-content">
              Forgot password?
            </Link>
            <span className="mx-2">·</span>
            <Link to="/" className="hover:text-content">
              Back to site
            </Link>
          </>
        }
      >
        <form onSubmit={onSubmit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@aiimageworld.com"
            required
          />
          <Input
            label="Password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />

          {error && (
            <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {error}
            </p>
          )}

          <Button type="submit" loading={submitting} className="w-full" size="lg">
            <LogIn className="h-4 w-4" /> Sign In
          </Button>
        </form>
      </AuthShell>
    </>
  );
}
