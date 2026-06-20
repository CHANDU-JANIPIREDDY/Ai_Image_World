'use strict';

/**
 * routes/upload.routes.js — Upload routes (API Spec §7). Admin only.
 *
 *   POST   /upload/image            multipart/form-data → Cloudinary
 *   DELETE /upload/image/:publicId  delete asset (folder-nested ids supported)
 */

const express = require('express');

const uploadController = require('../controllers/upload.controller');
const { verifyJWT, requireRole } = require('../middleware/auth.middleware');
const { uploadSingle } = require('../middleware/upload.middleware');

const router = express.Router();

const ADMIN_ROLES = ['superadmin', 'admin', 'editor'];

router.post(
  '/image',
  verifyJWT,
  requireRole(...ADMIN_ROLES),
  uploadSingle,
  uploadController.uploadImage
);

// publicId may contain '/' (folder path) → wildcard capture.
router.delete(
  '/image/:publicId(.*)',
  verifyJWT,
  requireRole(...ADMIN_ROLES),
  uploadController.deleteAsset
);

module.exports = router;
