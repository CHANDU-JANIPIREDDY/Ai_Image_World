'use strict';

/**
 * services/cloudinary.service.js — Image upload/transform/delete.
 *
 * Primary storage is Cloudinary. For local development, if Cloudinary is not
 * configured (or an upload fails), files fall back to local disk under
 * `server/uploads` and are served by Express at `/uploads/<file>`. The local
 * fallback is DEV-ONLY — in production Cloudinary credentials are required, so
 * a missing/failed upload throws instead of silently writing to disk.
 *
 * uploadImage      : buffer → { imageUrl, thumbnailUrl, publicId, … }
 * deleteImage      : remove an asset (Cloudinary publicId or local file)
 * generateThumbnail: Cloudinary transformed delivery URL
 */

const { Readable } = require('stream');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const { cloudinary, isConfigured } = require('../config/cloudinary');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');
const { resolveBaseUrl } = require('../utils/assetUrl');

/** Wrap a Buffer in a readable stream (single chunk). */
function bufferToStream(buffer) {
  const readable = new Readable();
  readable.push(buffer);
  readable.push(null);
  return readable;
}

const DEFAULT_FOLDER = 'ai-image-world';
const THUMB_WIDTH = 400;

/* --------------------------- local-disk fallback (dev) --------------------------- */

const UPLOAD_DIR = path.resolve(__dirname, '../../uploads');
const LOCAL_PREFIX = 'local/';
const EXT_BY_MIME = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

function ensureUploadDir() {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

/** Persist a buffer to local disk and return the same response shape as Cloudinary. */
function saveLocally(buffer, { mimetype, req } = {}) {
  ensureUploadDir();
  const ext = EXT_BY_MIME[mimetype] || 'png';
  const filename = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${ext}`;
  fs.writeFileSync(path.join(UPLOAD_DIR, filename), buffer);

  // Base URL precedence: env.APP_URL → request origin → localhost (see assetUrl).
  const url = `${resolveBaseUrl(req)}/uploads/${filename}`;
  return {
    imageUrl: url,
    thumbnailUrl: url, // no server-side transform locally
    publicId: `${LOCAL_PREFIX}${filename}`,
    width: null,
    height: null,
    format: ext,
    bytes: buffer.length,
  };
}

/* ------------------------------------ Cloudinary --------------------------------- */

function assertConfigured() {
  if (!isConfigured) {
    throw new ApiError(500, 'Image storage is not configured', 'UPLOAD_FAILED');
  }
}

/**
 * Build a thumbnail delivery URL for a given Cloudinary public id.
 */
function generateThumbnail(publicId, width = THUMB_WIDTH) {
  assertConfigured();
  return cloudinary.url(publicId, {
    secure: true,
    transformation: [
      { width, crop: 'limit' },
      { quality: 'auto', fetch_format: 'auto' },
    ],
  });
}

/** Stream a buffer to Cloudinary (resolves to the normalized response shape). */
function uploadToCloudinary(buffer, { folder = DEFAULT_FOLDER } = {}) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image' },
      (error, result) => {
        if (error || !result) {
          return reject(new ApiError(502, 'Image upload failed', 'UPLOAD_FAILED'));
        }
        return resolve({
          imageUrl: result.secure_url,
          thumbnailUrl: generateThumbnail(result.public_id),
          publicId: result.public_id,
          width: result.width,
          height: result.height,
          format: result.format,
          bytes: result.bytes,
        });
      }
    );
    bufferToStream(buffer).pipe(uploadStream);
  });
}

/**
 * Upload an image buffer. Uses Cloudinary when configured; otherwise (dev) saves
 * to local disk. In dev, a Cloudinary failure also falls back to local disk so
 * the Upload Center keeps working.
 *
 * @param {Buffer} buffer
 * @param {object} [opts]  { folder?, mimetype? }
 */
async function uploadImage(buffer, opts = {}) {
  if (isConfigured) {
    try {
      return await uploadToCloudinary(buffer, opts);
    } catch (err) {
      if (!env.isProd) {
        // eslint-disable-next-line no-console
        console.warn(`⚠️  [upload] Cloudinary failed (${err.message}); using local disk fallback.`);
        return saveLocally(buffer, opts);
      }
      throw err;
    }
  }

  if (!env.isProd) {
    // eslint-disable-next-line no-console
    console.warn('⚠️  [upload] Cloudinary not configured; storing image on local disk (dev only).');
    return saveLocally(buffer, opts);
  }

  throw new ApiError(500, 'Image storage is not configured', 'UPLOAD_FAILED');
}

/**
 * Delete an asset by id — a local file (`local/<name>`) or a Cloudinary publicId.
 */
async function deleteImage(publicId) {
  if (!publicId) throw ApiError.badRequest('publicId is required', 'BAD_REQUEST');

  // Local fallback file.
  if (publicId.startsWith(LOCAL_PREFIX)) {
    const filename = path.basename(publicId.slice(LOCAL_PREFIX.length));
    try {
      fs.unlinkSync(path.join(UPLOAD_DIR, filename));
    } catch {
      // already gone — treat as success
    }
    return { deleted: true, result: 'ok' };
  }

  assertConfigured();
  const res = await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });

  // Cloudinary returns { result: 'ok' | 'not found' }.
  if (res.result === 'not found') {
    throw ApiError.notFound('Asset not found', 'NOT_FOUND');
  }
  if (res.result !== 'ok') {
    throw new ApiError(500, 'Failed to delete asset', 'UPLOAD_FAILED');
  }
  return { deleted: true, result: res.result };
}

module.exports = { uploadImage, deleteImage, generateThumbnail, UPLOAD_DIR };
