'use strict';

/**
 * routes/analytics.routes.js — Analytics routes (API Spec §6).
 *
 *   POST /analytics/event            Public  (rate-limited)
 *   GET  /analytics/summary          Admin
 *   GET  /analytics/top-images       Admin
 *   GET  /analytics/top-categories   Admin
 *   GET  /analytics/top-searches     Admin
 */

const express = require('express');

const analyticsController = require('../controllers/analytics.controller');
const { verifyJWT, requireRole } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const { actionLimiter } = require('../middleware/rateLimiter');
const { recordEventSchema, reportQuerySchema } = require('../validators/analytics.validator');

const router = express.Router();

const ADMIN_ROLES = ['superadmin', 'admin', 'editor'];
const adminGuard = [verifyJWT, requireRole(...ADMIN_ROLES)];

// Public event ingestion
router.post('/event', actionLimiter, validate(recordEventSchema), analyticsController.recordEvent);

// Admin reporting
router.get('/summary', ...adminGuard, validate(reportQuerySchema), analyticsController.summary);
router.get('/top-images', ...adminGuard, validate(reportQuerySchema), analyticsController.topImages);
router.get(
  '/top-categories',
  ...adminGuard,
  validate(reportQuerySchema),
  analyticsController.topCategories
);
router.get(
  '/top-searches',
  ...adminGuard,
  validate(reportQuerySchema),
  analyticsController.topSearches
);

module.exports = router;
