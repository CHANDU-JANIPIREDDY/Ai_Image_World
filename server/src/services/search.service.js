'use strict';

/**
 * services/search.service.js — Image text search, suggestions, click logging.
 *
 * searchImages       : $text search over published images, relevance/latest/
 *                      popular sort, pagination, and search logging.
 * searchSuggestions  : prefix/substring matches across titles/categories/tags.
 * recordSearchClick  : attach a click-through image to a logged search.
 */

const { Image, Category, SearchLog } = require('../models');
const ApiError = require('../utils/ApiError');
const { dayKey, monthKey } = require('../utils/dateKeys');

const OBJECT_ID_RE = /^[0-9a-fA-F]{24}$/;
const RESULT_FIELDS = 'title slug thumbnailUrl category views promptCopyCount';

/** Resolve a category param (slug or id) → id, or null if unknown. */
async function resolveCategoryId(param) {
  if (!param) return undefined;
  if (OBJECT_ID_RE.test(param)) return param;
  const cat = await Category.findOne({ slug: param }).select('_id').lean();
  return cat ? cat._id : null;
}

/** Append a search log entry (day/month bucketed). */
async function logSearch({ query, rawQuery, resultsCount = 0, sessionId, device, clickedImageId }) {
  const now = new Date();
  await SearchLog.create({
    query: query.toLowerCase().trim(),
    rawQuery,
    resultsCount,
    sessionId,
    device,
    clickedImageId,
    day: dayKey(now),
    month: monthKey(now),
  });
}

/** Escape user input for safe use inside a RegExp. */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/* -------------------------------- searchImages ------------------------------- */

/**
 * Full-text search over published images.
 * @param {object} opts { q, category?, sort?, page?, limit?, sessionId?, device? }
 * @returns {Promise<{ images: object[], total: number, page: number, limit: number, query: string }>}
 */
async function searchImages({
  q,
  category,
  sort = 'relevance',
  page = 1,
  limit = 20,
  sessionId,
  device,
} = {}) {
  const filter = { $text: { $search: q }, status: 'published' };

  if (category !== undefined) {
    const categoryId = await resolveCategoryId(category);
    if (categoryId === null) {
      await logSearch({ query: q, rawQuery: q, resultsCount: 0, sessionId, device });
      return { images: [], total: 0, page, limit, query: q };
    }
    filter.category = categoryId;
  }

  const skip = (page - 1) * limit;

  let projection;
  let sortSpec;
  if (sort === 'relevance') {
    projection = {
      score: { $meta: 'textScore' },
      title: 1,
      slug: 1,
      thumbnailUrl: 1,
      category: 1,
      views: 1,
      promptCopyCount: 1,
    };
    sortSpec = { score: { $meta: 'textScore' } };
  } else {
    projection = RESULT_FIELDS;
    sortSpec = sort === 'popular' ? { views: -1, publishedAt: -1 } : { publishedAt: -1, _id: -1 };
  }

  const [images, total] = await Promise.all([
    Image.find(filter, projection)
      .sort(sortSpec)
      .skip(skip)
      .limit(limit)
      .populate('category', 'name slug')
      .lean(),
    Image.countDocuments(filter),
  ]);

  await logSearch({ query: q, rawQuery: q, resultsCount: total, sessionId, device });

  return { images, total, page, limit, query: q };
}

/* ------------------------------ searchSuggestions ---------------------------- */

/**
 * Autocomplete suggestions across titles, categories, and tags.
 * @param {object} opts { q }
 * @returns {Promise<{ tags: string[], categories: string[], titles: string[] }>}
 */
async function searchSuggestions({ q } = {}) {
  const safe = escapeRegex(q.trim());
  const contains = new RegExp(safe, 'i');
  const prefix = new RegExp(`^${safe}`, 'i');

  const [titleDocs, categoryDocs, tags] = await Promise.all([
    Image.find({ title: contains, status: 'published' }).select('title').limit(5).lean(),
    Category.find({ name: contains, isActive: true }).select('name').limit(5).lean(),
    Image.distinct('tags', { tags: prefix }),
  ]);

  return {
    tags: tags.slice(0, 5),
    categories: categoryDocs.map((c) => c.name),
    titles: titleDocs.map((t) => t.title),
  };
}

/* ------------------------------ recordSearchClick ---------------------------- */

/**
 * Record that a search result was clicked (attaches the image to the log).
 * @param {object} opts { query, imageId, sessionId? }
 */
async function recordSearchClick({ query, imageId, sessionId } = {}) {
  const exists = await Image.exists({ _id: imageId });
  if (!exists) throw ApiError.notFound('Image not found', 'NOT_FOUND');

  const norm = query.toLowerCase().trim();

  // Attach to the most recent matching log; if none, create one.
  const updated = await SearchLog.findOneAndUpdate(
    { query: norm, ...(sessionId ? { sessionId } : {}) },
    { $set: { clickedImageId: imageId } },
    { sort: { createdAt: -1 }, new: true }
  );

  if (!updated) {
    await logSearch({ query: norm, rawQuery: query, resultsCount: 0, sessionId, clickedImageId: imageId });
  }
}

module.exports = { searchImages, searchSuggestions, recordSearchClick };
