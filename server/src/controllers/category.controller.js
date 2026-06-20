'use strict';

/**
 * controllers/category.controller.js — Category endpoint handlers (thin).
 *
 * Validates-ready input → category.service → ApiResponse. Response shapes and
 * status codes follow API Spec §3.
 */

const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const categoryService = require('../services/category.service');

/** GET /categories  (Public) */
const list = asyncHandler(async (req, res) => {
  const { active, includeCounts } = req.query;
  const data = await categoryService.getCategories({ active, includeCounts });
  return ApiResponse.send(res, { message: 'Categories retrieved', data });
});

/** GET /categories/:slug  (Public) — category + paginated images */
const getBySlug = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const { page, limit, sort } = req.query;

  const result = await categoryService.getCategoryBySlug(slug, { page, limit, sort });

  return ApiResponse.send(res, {
    message: 'Category retrieved',
    data: { category: result.category, images: result.images },
    meta: {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: Math.ceil(result.total / result.limit) || 0,
    },
  });
});

/** POST /categories  (Admin) */
const create = asyncHandler(async (req, res) => {
  const category = await categoryService.createCategory(req.body);
  return ApiResponse.send(res, {
    statusCode: 201,
    message: 'Category created',
    data: { id: category._id, name: category.name, slug: category.slug },
  });
});

/** PUT /categories/:id  (Admin) */
const update = asyncHandler(async (req, res) => {
  const category = await categoryService.updateCategory(req.params.id, req.body);
  return ApiResponse.send(res, {
    message: 'Category updated',
    data: { id: category._id, name: category.name, slug: category.slug },
  });
});

/** DELETE /categories/:id  (Admin) */
const remove = asyncHandler(async (req, res) => {
  const { reassigned } = await categoryService.deleteCategory(req.params.id, {
    force: req.query.force,
  });
  return ApiResponse.send(res, {
    message: 'Category deleted',
    ...(reassigned ? { data: { reassigned } } : {}),
  });
});

module.exports = { list, getBySlug, create, update, remove };
