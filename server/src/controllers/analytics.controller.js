'use strict';

/**
 * controllers/analytics.controller.js — Analytics endpoint handlers (thin).
 *
 * recordEvent returns 202 Accepted (API Spec §6.1). Reporting endpoints are
 * admin-only (gated at the route) and return aggregated data.
 */

const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const analyticsService = require('../services/analytics.service');

/** POST /analytics/event  (Public) */
const recordEvent = asyncHandler(async (req, res) => {
  await analyticsService.recordEvent(req.body);
  return ApiResponse.send(res, { statusCode: 202, message: 'Event accepted' });
});

/** GET /analytics/summary  (Admin) */
const summary = asyncHandler(async (req, res) => {
  const data = await analyticsService.getSummary(req.query);
  return ApiResponse.send(res, { message: 'Analytics summary', data });
});

/** GET /analytics/top-images  (Admin) */
const topImages = asyncHandler(async (req, res) => {
  const data = await analyticsService.getTopImages(req.query);
  return ApiResponse.send(res, { message: 'Most viewed images', data });
});

/** GET /analytics/top-categories  (Admin) */
const topCategories = asyncHandler(async (req, res) => {
  const data = await analyticsService.getTopCategories(req.query);
  return ApiResponse.send(res, { message: 'Most viewed categories', data });
});

/** GET /analytics/top-searches  (Admin) */
const topSearches = asyncHandler(async (req, res) => {
  const data = await analyticsService.getTopSearches(req.query);
  return ApiResponse.send(res, { message: 'Top searches', data });
});

module.exports = { recordEvent, summary, topImages, topCategories, topSearches };
