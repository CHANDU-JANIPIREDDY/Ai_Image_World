import api from './axios';

/**
 * services/images.api.js — Image endpoint calls (API Spec §4).
 * Each returns the unwrapped envelope: { success, message, data, meta? }.
 */

export const getImages = (params) => api.get('/images', { params });

export const getTrendingImages = (params) => api.get('/images/trending', { params });

export const getLatestImages = (params) => api.get('/images/latest', { params });

export const getImageBySlug = (slug) => api.get(`/images/${slug}`);

export const copyPrompt = (id) => api.post(`/images/${id}/copy`);

export const likeImage = (id) => api.post(`/images/${id}/like`);

export const unlikeImage = (id) => api.post(`/images/${id}/unlike`);

/* ------------------------------- Admin (auth) ------------------------------- */

export const createImage = (payload) => api.post('/images', payload);

export const updateImage = (id, payload) => api.put(`/images/${id}`, payload);

export const deleteImage = (id) => api.delete(`/images/${id}`);
