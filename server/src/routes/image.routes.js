'use strict';

/**
 * routes/image.routes.js — Image routes (API Spec §4).
 *
 *   GET    /images            Public (optionalAuth → admins see all statuses)
 *   GET    /images/trending   Public
 *   GET    /images/latest     Public
 *   GET    /images/:slug      Public (optionalAuth; increments views)
 *   POST   /images/:id/copy   Public (rate-limited)
 *   POST   /images/:id/like   Public (rate-limited)
 *   POST   /images/:id/unlike Public (rate-limited)
 *   POST   /images            Admin
 *   PUT    /images/:id        Admin
 *   DELETE /images/:id        Admin
 *
 * Static segments (/trending, /latest) are declared before /:slug so they are
 * not captured by the slug param.
 */

const express = require('express');

const imageController = require('../controllers/image.controller');
const { verifyJWT, optionalAuth, requireRole } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const { actionLimiter } = require('../middleware/rateLimiter');
const {
  createImageSchema,
  updateImageSchema,
  listImagesSchema,
  trendingImagesSchema,
  latestImagesSchema,
  imageBySlugSchema,
  imageIdSchema,
} = require('../validators/image.validator');

const router = express.Router();

const ADMIN_ROLES = ['superadmin', 'admin', 'editor'];

/* -------------------------------- Public ---------------------------------- */

router.get('/trending', validate(trendingImagesSchema), imageController.trending);
router.get('/latest', validate(latestImagesSchema), imageController.latest);
router.get('/', optionalAuth, validate(listImagesSchema), imageController.list);
router.get('/:slug', optionalAuth, validate(imageBySlugSchema), imageController.getBySlug);

router.post(
  '/:id/copy',
  actionLimiter,
  validate(imageIdSchema),
  imageController.copyPrompt
);

router.post(
  '/:id/like',
  actionLimiter,
  validate(imageIdSchema),
  imageController.like
);

router.post(
  '/:id/unlike',
  actionLimiter,
  validate(imageIdSchema),
  imageController.unlike
);

/* --------------------------------- Admin ---------------------------------- */

router.post(
  '/',
  verifyJWT,
  requireRole(...ADMIN_ROLES),
  validate(createImageSchema),
  imageController.create
);
router.put(
  '/:id',
  verifyJWT,
  requireRole(...ADMIN_ROLES),
  validate(updateImageSchema),
  imageController.update
);
router.delete(
  '/:id',
  verifyJWT,
  requireRole(...ADMIN_ROLES),
  validate(imageIdSchema),
  imageController.remove
);

module.exports = router;
