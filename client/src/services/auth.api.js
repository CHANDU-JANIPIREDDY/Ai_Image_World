import api from './axios';

/**
 * services/auth.api.js — Admin authentication calls (API Spec §2).
 * Each returns the unwrapped envelope: { success, message, data? }.
 */

export const login = (email, password) => api.post('/auth/login', { email, password });

export const getMe = () => api.get('/auth/me');

export const refreshToken = () => api.post('/auth/refresh');

export const logout = () => api.post('/auth/logout');

export const changePassword = (currentPassword, newPassword) =>
  api.put('/auth/change-password', { currentPassword, newPassword });
