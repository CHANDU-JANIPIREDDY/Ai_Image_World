'use strict';

/**
 * validators/search.validator.js — Schemas for search endpoints.
 */

const { z } = require('zod');

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

// GET /search
const searchSchema = {
  query: z.object({
    q: z.string().min(1, 'Search query is required').max(100, 'Query too long').trim(),
    category: z.string().optional(),
    sort: z.enum(['relevance', 'latest', 'popular']).default('relevance'),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
    sessionId: z.string().max(100).optional(),
  }),
};

// GET /search/suggestions
const suggestionsSchema = {
  query: z.object({
    q: z.string().min(2, 'At least 2 characters required').max(100).trim(),
  }),
};

// POST /search/click
const clickSchema = {
  body: z.object({
    query: z.string().min(1, 'Query is required').max(100),
    imageId: objectId,
    sessionId: z.string().max(100).optional(),
  }),
};

module.exports = { searchSchema, suggestionsSchema, clickSchema };
