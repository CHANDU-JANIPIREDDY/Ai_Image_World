'use strict';

/**
 * routes/category.routes.js — Category routes (API Spec §3).
 *
 *   GET    /categories        Public
 *   GET    /categories/:slug  Public  (category + paginated images)
 *   POST   /categories        Admin
 *   PUT    /categories/:id     Admin
 *   DELETE /categories/:id     Admin   (?force=true)
 */

const express = require('express');

const categoryController = require('../controllers/category.controller');
const { verifyJWT, requireRole } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const {
  createCategorySchema,
  updateCategorySchema,
  listCategoriesSchema,
  categoryBySlugSchema,
  deleteCategorySchema,
} = require('../validators/category.validator');

const router = express.Router();

// Roles allowed to manage content (API Spec 🔒 Admin).
const ADMIN_ROLES = ['superadmin', 'admin', 'editor'];

// Public reads
router.get('/', validate(listCategoriesSchema), categoryController.list);
router.get('/:slug', validate(categoryBySlugSchema), categoryController.getBySlug);

// Admin writes
router.post(
  '/',
  verifyJWT,
  requireRole(...ADMIN_ROLES),
  validate(createCategorySchema),
  categoryController.create
);
router.put(
  '/:id',
  verifyJWT,
  requireRole(...ADMIN_ROLES),
  validate(updateCategorySchema),
  categoryController.update
);
router.delete(
  '/:id',
  verifyJWT,
  requireRole(...ADMIN_ROLES),
  validate(deleteCategorySchema),
  categoryController.remove
);

module.exports = router;
