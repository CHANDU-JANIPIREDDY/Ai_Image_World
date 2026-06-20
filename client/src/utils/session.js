/**
 * session.js — anonymous session + device helpers for analytics.
 *
 * A stable per-browser session id lets the backend de-duplicate visits and
 * attribute search click-throughs without any personal data. Device class is
 * derived from viewport width and matches the API's allowed values.
 */

const SESSION_KEY = 'aiw_session_id';

/** Stable anonymous session id, persisted in localStorage. */
export function getSessionId() {
  try {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      id =
        (typeof crypto !== 'undefined' && crypto.randomUUID && crypto.randomUUID()) ||
        `s_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    // Private mode / storage disabled — analytics still works without a session.
    return undefined;
  }
}

/** Coarse device class: 'mobile' | 'tablet' | 'desktop' (API enum). */
export function getDevice() {
  if (typeof window === 'undefined') return 'other';
  const w = window.innerWidth;
  if (w < 640) return 'mobile';
  if (w < 1024) return 'tablet';
  return 'desktop';
}
