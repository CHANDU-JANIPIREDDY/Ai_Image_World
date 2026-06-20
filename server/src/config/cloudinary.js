'use strict';

/**
 * config/cloudinary.js — Cloudinary SDK configuration.
 *
 * Configured once from the validated env (credentials are required in
 * production by config/env.js). `secure: true` ensures HTTPS delivery URLs.
 * `isConfigured` lets the service fail with a clear message in dev when
 * credentials are missing, instead of issuing a doomed API call.
 */

const { v2: cloudinary } = require('cloudinary');
const env = require('./env');

const isConfigured = Boolean(
  env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET
);

if (isConfigured) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

module.exports = { cloudinary, isConfigured };
