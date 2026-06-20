/**
 * settings.js — local (browser) site settings storage.
 *
 * These are presentational admin preferences (site name, description, logo,
 * accent theme) persisted in localStorage. They are intentionally client-side:
 * the backend has no settings endpoint, so this is the source of truth for the
 * dashboard's Settings page.
 */

const KEY = 'aiw_site_settings';

export const DEFAULT_SETTINGS = {
  siteName: 'AI Image World',
  siteDescription: 'Discover AI-generated images and copy professional prompts.',
  logoDataUrl: '',
  accent: 'violet', // violet | teal | pink | blue
};

export function getSettings() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : { ...DEFAULT_SETTINGS };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings) {
  const merged = { ...DEFAULT_SETTINGS, ...settings };
  localStorage.setItem(KEY, JSON.stringify(merged));
  return merged;
}

export function resetSettings() {
  localStorage.removeItem(KEY);
  return { ...DEFAULT_SETTINGS };
}
