'use strict';

/**
 * validators/category.validator.js — Request schemas for category endpoints.
 *
 * Shaped as { body?, query?, params? } for the generic validate middleware.
 * Covers create, update, list-query, slug-images-query, and delete-query.
 */

const { z } = require('zod');

/* --------------------------------- Helpers --------------------------------- */

// 24-hex Mongo ObjectId.
const objectId = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

// Query-string booleans arrive as strings ('true'/'false'); coerce safely.
const boolish = z
  .union([z.boolean(), z.enum(['true', 'false'])])
  .transform((v) => v === true || v === 'true');

const optionalUrl = z.string().url('Must be a valid URL').optional();

/* ------------------------------ Field schemas ------------------------------ */

const nameField = z
  .string()
  .min(2, 'Name must be at least 2 characters')
  .max(80, 'Name must be at most 80 characters')
  .trim();

const baseCategoryFields = {
  description: z.string().max(500, 'Description too long').optional(),
  thumbnailUrl: optionalUrl,
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
  seoTitle: z.string().max(70, 'SEO title too long').optional(),
  seoDescription: z.string().max(160, 'SEO description too long').optional(),
};

/* -------------------------------- Schemas ---------------------------------- */

const createCategorySchema = {
  body: z.object({
    name: nameField,
    ...baseCategoryFields,
  }),
};

const updateCategorySchema = {
  params: z.object({ id: objectId }),
  body: z
    .object({
      name: nameField.optional(),
      ...baseCategoryFields,
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one field is required to update',
    }),
};

// GET /categories
const listCategoriesSchema = {
  query: z.object({
    active: boolish.optional(),
    includeCounts: boolish.optional(),
  }),
};

// GET /categories/:slug  (category + its images, paginated)
const categoryBySlugSchema = {
  params: z.object({ slug: z.string().min(1) }),
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
    sort: z.enum(['latest', 'oldest', 'popular', 'most_copied']).default('latest'),
  }),
};

// DELETE /categories/:id?force=true
const deleteCategorySchema = {
  params: z.object({ id: objectId }),
  query: z.object({ force: boolish.optional() }),
};

module.exports = {
  objectId,
  createCategorySchema,
  updateCategorySchema,
  listCategoriesSchema,
  categoryBySlugSchema,
  deleteCategorySchema,
};
