import api from './axios';

/**
 * services/upload.api.js — Cloudinary image upload (API Spec §7, Admin only).
 * Returns { imageUrl, thumbnailUrl, publicId, width, height, format, bytes }.
 */

export const uploadImage = (file, folder) => {
  const form = new FormData();
  form.append('file', file);
  if (folder) form.append('folder', folder);
  // Override the default JSON content-type so the browser sets the multipart
  // boundary itself.
  return api.post('/upload/image', form, { headers: { 'Content-Type': undefined } });
};

export const deleteAsset = (publicId) =>
  api.delete(`/upload/image/${encodeURIComponent(publicId)}`);
