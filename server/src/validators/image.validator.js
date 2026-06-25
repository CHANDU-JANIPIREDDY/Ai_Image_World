'use strict';

/**
 * validators/image.validator.js — Request schemas for image endpoints.
 *
 * Shaped as { body?, query?, params? } for the generic validate middleware.
 * A superRefine enforces: status 'scheduled' ⇒ a future scheduledAt
 * (DB Design / API Spec §4.6).
 */

const { z } = require('zod');

/* --------------------------------- Helpers --------------------------------- */

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

const boolish = z
  .union([z.boolean(), z.enum(['true', 'false'])])
  .transform((v) => v === true || v === 'true');

const STATUS = ['draft', 'published', 'scheduled'];
const SORTS = ['latest', 'oldest', 'popular', 'most_copied', 'most_liked'];

const tagsField = z
  .array(z.string().min(1).max(30).trim())
  .max(20, 'At most 20 tags')
  .optional();

/* ------------------------------ Field schemas ------------------------------ */

const baseImageFields = {
  imageUrl: z.string().url('imageUrl must be a valid URL'),
  thumbnailUrl: z.string().url('thumbnailUrl must be a valid URL').optional(),
  publicId: z.string().min(1).optional(), // Cloudinary public_id (from /upload/image)
  prompt: z.string().min(1, 'Prompt is required'),
  negativePrompt: z.string().optional(),
  category: objectId,
  tags: tagsField,
  sourceAiTool: z.string().max(60).trim().optional(),
  featured: z.boolean().optional(),
  status: z.enum(STATUS).optional(),
  scheduledAt: z.coerce.date().optional(),
  seoTitle: z.string().max(70, 'SEO title too long').optional(),
  seoDescription: z.string().max(160, 'SEO description too long').optional(),
};

// Shared rule: scheduled status requires a future scheduledAt.
const scheduledRefinement = (data, ctx) => {
  if (data.status === 'scheduled') {
    if (!data.scheduledAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['scheduledAt'],
        message: 'scheduledAt is required when status is "scheduled"',
      });
    } else if (data.scheduledAt.getTime() <= Date.now()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['scheduledAt'],
        message: 'scheduledAt must be in the future',
      });
    }
  }
};

/* -------------------------------- Schemas ---------------------------------- */

const createImageSchema = {
  body: z
    .object({
      title: z.string().min(2, 'Title too short').max(150, 'Title too long').trim(),
      ...baseImageFields,
    })
    .superRefine(scheduledRefinement),
};

const updateImageSchema = {
  params: z.object({ id: objectId }),
  body: z
    .object({
      title: z.string().min(2).max(150).trim().optional(),
      ...baseImageFields,
      imageUrl: baseImageFields.imageUrl.optional(),
      prompt: baseImageFields.prompt.optional(),
      category: objectId.optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one field is required to update',
    })
    .superRefine(scheduledRefinement),
};

// GET /images
const listImagesSchema = {
  query: z.object({
    category: z.string().optional(), // slug or id (resolved in service)
    tag: z.string().optional(),
    featured: boolish.optional(),
    status: z.enum(STATUS).optional(), // honored only for admins (service-gated)
    sort: z.enum(SORTS).default('latest'),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
  }),
};

// GET /images/trending
const trendingImagesSchema = {
  query: z.object({
    window: z.coerce.number().int().min(1).max(365).default(7),
    limit: z.coerce.number().int().min(1).max(50).default(20),
  }),
};

// GET /images/latest
const latestImagesSchema = {
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
  }),
};

const imageBySlugSchema = { params: z.object({ slug: z.string().min(1) }) };
const imageIdSchema = { params: z.object({ id: objectId }) };

module.exports = {
  objectId,
  createImageSchema,
  updateImageSchema,
  listImagesSchema,
  trendingImagesSchema,
  latestImagesSchema,
  imageBySlugSchema,
  imageIdSchema,
};
