'use strict';

/**
 * utils/assetUrl.js — Absolute URL resolution for locally-served uploads.
 *
 * Cloudinary returns absolute HTTPS URLs already, so those pass through
 * untouched. The local-disk fallback (dev / Cloudinary-less deploys) only knows
 * the server's own origin, which must be resolved at request time so the same
 * stored file works on localhost AND on the production host.
 *
 * Precedence for the base URL:
 *   1. env.APP_URL                         (explicit, e.g. https://…onrender.com)
 *   2. req.protocol + req.get('host')      (derived from the incoming request)
 *   3. http://localhost:<PORT>             (last-resort dev fallback)
 */

const env = require('./../config/env');

const stripTrailingSlash = (s) => s.replace(/\/+$/, '');

/** Resolve the absolute base URL to use for local upload links. */
function resolveBaseUrl(req) {
  if (env.APP_URL) return stripTrailingSlash(env.APP_URL);
  if (req && typeof req.get === 'function') {
    const host = req.get('host');
    if (host) return `${req.protocol}://${host}`;
  }
  return `http://localhost:${env.PORT}`;
}

// Matches a locally-served upload that points at this server, in either form:
//   /uploads/<file>                              (relative)
//   http(s)://localhost:5000/uploads/<file>      (absolute, any local host)
//   http(s)://<anything>/uploads/<file>          (absolute, e.g. baked-in host)
const LOCAL_UPLOAD_RE = /^(?:https?:\/\/[^/]+)?(\/uploads\/.+)$/;

/**
 * Rewrite a single locally-served upload URL to the current origin.
 * Absolute Cloudinary / external CDN URLs are returned unchanged.
 * @param {string} url
 * @param {import('express').Request} [req]
 * @returns {string}
 */
function resolveAssetUrl(url, req) {
  if (!url || typeof url !== 'string') return url;
  const match = url.match(LOCAL_UPLOAD_RE);
  if (!match) return url; // Cloudinary or other external URL — leave as-is
  return `${resolveBaseUrl(req)}${match[1]}`;
}

/**
 * Normalize imageUrl/thumbnailUrl on an image-like object (mutates and returns).
 * No-op for plain values; safe on lean() docs and nested related images.
 */
function normalizeImageUrls(obj, req) {
  if (!obj || typeof obj !== 'object') return obj;
  if (typeof obj.imageUrl === 'string') obj.imageUrl = resolveAssetUrl(obj.imageUrl, req);
  if (typeof obj.thumbnailUrl === 'string') {
    obj.thumbnailUrl = resolveAssetUrl(obj.thumbnailUrl, req);
  }
  return obj;
}

/** Normalize a single image, an array of images, or null — convenience wrapper. */
function normalizeImagePayload(payload, req) {
  if (Array.isArray(payload)) {
    payload.forEach((item) => normalizeImageUrls(item, req));
  } else {
    normalizeImageUrls(payload, req);
  }
  return payload;
}

module.exports = {
  resolveBaseUrl,
  resolveAssetUrl,
  normalizeImageUrls,
  normalizeImagePayload,
};
