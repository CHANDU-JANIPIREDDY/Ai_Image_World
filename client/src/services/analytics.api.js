import api from './axios';

/**
 * services/analytics.api.js — Analytics event ingestion (API Spec §6.1).
 *
 * recordEvent is fire-and-forget: tracking failures must never disrupt the UI,
 * so errors are swallowed (logged in dev only).
 */

export const recordEvent = (payload) =>
  api.post('/analytics/event', payload).catch((err) => {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.debug('[analytics] event failed:', err.message);
    }
  });

/* --------------------------- Admin reporting (auth) -------------------------- */

export const getSummary = (params) => api.get('/analytics/summary', { params });

export const getTopImages = (params) => api.get('/analytics/top-images', { params });

export const getTopCategories = (params) => api.get('/analytics/top-categories', { params });

export const getTopSearches = (params) => api.get('/analytics/top-searches', { params });
