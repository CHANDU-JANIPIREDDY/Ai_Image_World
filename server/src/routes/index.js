'use strict';

/**
 * routes/index.js — API v1 router barrel.
 *
 * Mounts all feature routers under a single router that app.js attaches at
 * /api/v1. Additional routers (categories, images, search, analytics, upload)
 * are added here in later phases.
 */

const express = require('express');

const authRoutes = require('./auth.routes');
const categoryRoutes = require('./category.routes');
const imageRoutes = require('./image.routes');
const uploadRoutes = require('./upload.routes');
const analyticsRoutes = require('./analytics.routes');
const searchRoutes = require('./search.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/categories', categoryRoutes);
router.use('/images', imageRoutes);
router.use('/upload', uploadRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/search', searchRoutes);

module.exports = router;
