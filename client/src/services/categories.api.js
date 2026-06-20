import api from './axios';

/**
 * services/categories.api.js — Category endpoint calls (API Spec §3).
 */

export const getCategories = (params) => api.get('/categories', { params });

export const getCategoryBySlug = (slug, params) => api.get(`/categories/${slug}`, { params });

/* ------------------------------- Admin (auth) ------------------------------- */

export const createCategory = (payload) => api.post('/categories', payload);

export const updateCategory = (id, payload) => api.put(`/categories/${id}`, payload);

export const deleteCategory = (id, force = false) =>
  api.delete(`/categories/${id}`, { params: force ? { force: true } : {} });
