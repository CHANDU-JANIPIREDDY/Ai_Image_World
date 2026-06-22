'use strict';

/**
 * controllers/image.controller.js — Image endpoint handlers (thin).
 *
 * Validates-ready input → image.service → ApiResponse. `isAdmin` is derived
 * from req.user (set by optionalAuth/verifyJWT) to gate non-published content.
 * Response shapes/status codes follow API Spec §4.
 */

const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const imageService = require('../services/image.service');
const { normalizeImagePayload, normalizeImageUrls } = require('../utils/assetUrl');

const buildMeta = ({ total, page, limit }) => ({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit) || 0,
});

/** GET /images  (Public; admins may pass status / see all) */
const list = asyncHandler(async (req, res) => {
  const isAdmin = Boolean(req.user);
  const result = await imageService.getImages({ ...req.query, isAdmin });
  return ApiResponse.send(res, {
    message: 'Images retrieved',
    data: normalizeImagePayload(result.images, req),
    meta: buildMeta(result),
  });
});

/** GET /images/trending  (Public) */
const trending = asyncHandler(async (req, res) => {
  const data = await imageService.getTrendingImages(req.query);
  return ApiResponse.send(res, {
    message: 'Trending images',
    data: normalizeImagePayload(data, req),
  });
});

/** GET /images/latest  (Public) */
const latest = asyncHandler(async (req, res) => {
  const result = await imageService.getLatestImages(req.query);
  return ApiResponse.send(res, {
    message: 'Latest images',
    data: normalizeImagePayload(result.images, req),
    meta: buildMeta(result),
  });
});

/** GET /images/:slug  (Public; increments views) */
const getBySlug = asyncHandler(async (req, res) => {
  const isAdmin = Boolean(req.user);
  const { image, related } = await imageService.getImageBySlug(req.params.slug, { isAdmin });
  return ApiResponse.send(res, {
    message: 'Image retrieved',
    data: {
      ...normalizeImageUrls(image, req),
      related: normalizeImagePayload(related, req),
    },
  });
});

/** POST /images/:id/copy  (Public) — increment promptCopyCount */
const copyPrompt = asyncHandler(async (req, res) => {
  const data = await imageService.incrementPromptCopyCount(req.params.id);
  return ApiResponse.send(res, { message: 'Copy recorded', data });
});

/** POST /images  (Admin) */
const create = asyncHandler(async (req, res) => {
  const image = await imageService.createImage(req.body, req.user.id);
  return ApiResponse.send(res, {
    statusCode: 201,
    message: 'Image created',
    data: { id: image._id, slug: image.slug, status: image.status },
  });
});

/** PUT /images/:id  (Admin) */
const update = asyncHandler(async (req, res) => {
  const image = await imageService.updateImage(req.params.id, req.body);
  return ApiResponse.send(res, {
    message: 'Image updated',
    data: { id: image._id, slug: image.slug, status: image.status },
  });
});

/** DELETE /images/:id  (Admin) */
const remove = asyncHandler(async (req, res) => {
  await imageService.deleteImage(req.params.id);
  return ApiResponse.send(res, { message: 'Image deleted' });
});

module.exports = { list, trending, latest, getBySlug, copyPrompt, create, update, remove };
