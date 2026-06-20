import api from './axios';

/**
 * services/search.api.js — Search endpoint calls (API Spec §5).
 */

export const searchImages = (params) => api.get('/search', { params });

export const getSearchSuggestions = (q) => api.get('/search/suggestions', { params: { q } });

/** Log a result click-through (best-effort; never blocks navigation). */
export const recordSearchClick = (payload) =>
  api.post('/search/click', payload).catch(() => {});
