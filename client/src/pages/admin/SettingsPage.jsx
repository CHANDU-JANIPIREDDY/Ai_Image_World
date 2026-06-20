import { useRef, useState } from 'react';
import { Save, Image as ImageIcon, KeyRound } from 'lucide-react';

import { Seo } from '@/components/common/Seo';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { getSettings, saveSettings } from '@/utils/settings';
import { changePassword } from '@/services/auth.api';
import { cn } from '@/utils/cn';

const ACCENTS = [
  { key: 'violet', class: 'bg-[#7C3AED]' },
  { key: 'teal', class: 'bg-[#14B8A6]' },
  { key: 'pink', class: 'bg-[#EC4899]' },
  { key: 'blue', class: 'bg-[#3B82F6]' },
];

/**
 * SettingsPage — local (browser) site settings + a live change-password form
 * (PUT /auth/change-password). Settings are stored in localStorage because the
 * backend has no settings endpoint.
 */
export default function SettingsPage() {
  const toast = useToast();
  const logoRef = useRef(null);
  const [settings, setSettings] = useState(getSettings);

  // Change-password state
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' });
  const [pwError, setPwError] = useState('');
  const [pwSaving, setPwSaving] = useState(false);

  const set = (key) => (e) => setSettings((s) => ({ ...s, [key]: e.target.value }));

  const onLogo = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setSettings((s) => ({ ...s, logoDataUrl: reader.result }));
    reader.readAsDataURL(file);
  };

  const saveLocal = () => {
    saveSettings(settings);
    toast.success('Settings saved');
  };

  const submitPassword = async (e) => {
    e.preventDefault();
    setPwError('');
    setPwSaving(true);
    try {
      await changePassword(pw.currentPassword, pw.newPassword);
      toast.success('Password changed');
      setPw({ currentPassword: '', newPassword: '' });
    } catch (err) {
      setPwError(err.errors?.[0]?.message || err.message || 'Could not change password');
    } finally {
      setPwSaving(false);
    }
  };

  return (
    <>
      <Seo title="Settings" />
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="mt-1 text-sm text-content-muted">Site presentation and your account.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Site settings (local) */}
        <div className="rounded-2xl glass-panel p-6">
          <h2 className="mb-4 text-sm font-semibold text-content-muted">Site Settings (local)</h2>
          <div className="space-y-4">
            <Input label="Site name" value={settings.siteName} onChange={set('siteName')} />
            <div>
              <label className="mb-1.5 block text-sm font-medium text-content">Site description</label>
              <textarea
                value={settings.siteDescription}
                onChange={set('siteDescription')}
                rows={3}
                className="w-full rounded-xl border border-white/10 bg-surface px-4 py-2 text-content focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            {/* Logo */}
            <div>
              <span className="mb-1.5 block text-sm font-medium text-content">Logo</span>
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-surface">
                  {settings.logoDataUrl ? (
                    <img src={settings.logoDataUrl} alt="Logo" className="h-full w-full object-contain" />
                  ) : (
                    <ImageIcon className="h-5 w-5 text-content-muted" />
                  )}
                </div>
                <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={onLogo} />
                <Button variant="outline" size="sm" onClick={() => logoRef.current?.click()}>
                  Upload logo
                </Button>
              </div>
            </div>

            {/* Accent */}
            <div>
              <span className="mb-1.5 block text-sm font-medium text-content">Accent theme</span>
              <div className="flex gap-2">
                {ACCENTS.map((a) => (
                  <button
                    key={a.key}
                    type="button"
                    onClick={() => setSettings((s) => ({ ...s, accent: a.key }))}
                    aria-label={a.key}
                    className={cn(
                      'h-8 w-8 rounded-full ring-2 ring-offset-2 ring-offset-background transition',
                      a.class,
                      settings.accent === a.key ? 'ring-white' : 'ring-transparent'
                    )}
                  />
                ))}
              </div>
            </div>

            <Button onClick={saveLocal}>
              <Save className="h-4 w-4" /> Save settings
            </Button>
          </div>
        </div>

        {/* Change password (real API) */}
        <div className="rounded-2xl glass-panel p-6">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-content-muted">
            <KeyRound className="h-4 w-4" /> Change Password
          </h2>
          <form onSubmit={submitPassword} className="space-y-4">
            <Input
              label="Current password"
              type="password"
              autoComplete="current-password"
              value={pw.currentPassword}
              onChange={(e) => setPw((p) => ({ ...p, currentPassword: e.target.value }))}
              required
            />
            <Input
              label="New password"
              type="password"
              autoComplete="new-password"
              value={pw.newPassword}
              onChange={(e) => setPw((p) => ({ ...p, newPassword: e.target.value }))}
              required
            />
            <p className="text-xs text-content-muted">
              At least 8 characters, with an uppercase letter and a number.
            </p>
            {pwError && (
              <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                {pwError}
              </p>
            )}
            <Button type="submit" loading={pwSaving}>
              Update password
            </Button>
          </form>
        </div>
      </div>
    </>
  );
}
