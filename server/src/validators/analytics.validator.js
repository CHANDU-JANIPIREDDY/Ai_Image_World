'use strict';

/**
 * validators/analytics.validator.js — Schemas for analytics endpoints.
 */

const { z } = require('zod');

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

// POST /analytics/event
const recordEventSchema = {
  body: z
    .object({
      eventType: z.enum(['visit', 'image_view', 'category_view', 'prompt_copy']),
      targetType: z.enum(['site', 'image', 'category']),
      targetId: objectId.optional(),
      sessionId: z.string().max(100).optional(),
      visitorHash: z.string().max(128).optional(),
      referrer: z.string().max(500).optional(),
      device: z.enum(['mobile', 'tablet', 'desktop', 'other']).optional(),
      country: z.string().max(3).optional(),
    })
    .superRefine((data, ctx) => {
      if (data.targetType !== 'site' && !data.targetId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['targetId'],
          message: 'targetId is required when targetType is not "site"',
        });
      }
    }),
};

// Shared query schema for the reporting endpoints.
const reportQuerySchema = {
  query: z.object({
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
    granularity: z.enum(['day', 'month']).default('day'),
    limit: z.coerce.number().int().min(1).max(50).default(10),
  }),
};

module.exports = { recordEventSchema, reportQuerySchema };
