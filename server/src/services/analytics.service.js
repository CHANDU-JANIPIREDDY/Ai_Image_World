'use strict';

/**
 * services/analytics.service.js — Event logging + aggregated reporting.
 *
 * recordEvent       : append an immutable event (day/month bucketed).
 * getSummary        : total/today/month visitors + daily series.
 * getTopImages      : most-viewed images (denormalized all-time, or event-log
 *                     aggregation when a date range is given).
 * getTopCategories  : most-viewed categories (same strategy).
 * getTopSearches    : most frequent search queries.
 */

const { Analytics, Image, Category, SearchLog } = require('../models');
const { dayKey, monthKey } = require('../utils/dateKeys');

const TARGET_MODEL = { image: 'Image', category: 'Category' };
const DEFAULT_SERIES_DAYS = 30;

/** Build a createdAt range match from optional from/to dates. */
function rangeMatch(from, to) {
  if (!from && !to) return {};
  const createdAt = {};
  if (from) createdAt.$gte = new Date(from);
  if (to) createdAt.$lte = new Date(to);
  return { createdAt };
}

/* -------------------------------- recordEvent -------------------------------- */

/**
 * Append an analytics event. Identifiers are anonymized (no PII).
 * @param {object} data  { eventType, targetType, targetId?, sessionId?, ... }
 * @returns {Promise<void>}
 */
async function recordEvent(data) {
  const now = new Date();
  await Analytics.create({
    ...data,
    targetModel: TARGET_MODEL[data.targetType],
    day: dayKey(now),
    month: monthKey(now),
  });
}

/* --------------------------------- getSummary -------------------------------- */

/**
 * Visitor summary + daily series.
 * @param {object} opts { from?, to? }
 */
async function getSummary({ from, to } = {}) {
  const todayKey = dayKey();
  const mKey = monthKey();

  const [totalVisitors, todayVisitors, monthVisitors, publishedImages] = await Promise.all([
    Analytics.countDocuments({ eventType: 'visit' }),
    Analytics.countDocuments({ eventType: 'visit', day: todayKey }),
    Analytics.countDocuments({ eventType: 'visit', month: mKey }),
    Image.countDocuments({ status: 'published' }),
  ]);

  // Default the series window to the last 30 days when no range is provided.
  const seriesFrom =
    from || new Date(Date.now() - DEFAULT_SERIES_DAYS * 24 * 60 * 60 * 1000);
  const series = await Analytics.aggregate([
    { $match: { eventType: 'visit', ...rangeMatch(seriesFrom, to) } },
    { $group: { _id: '$day', visitors: { $sum: 1 } } },
    { $sort: { _id: 1 } },
    { $project: { _id: 0, date: '$_id', visitors: 1 } },
  ]);

  return { totalVisitors, todayVisitors, monthVisitors, publishedImages, series };
}

/* ------------------------------- getTopImages -------------------------------- */

/**
 * Most-viewed images. Uses denormalized views all-time; aggregates the event
 * log when a date range is supplied.
 * @param {object} opts { from?, to?, limit? }
 */
async function getTopImages({ from, to, limit = 10 } = {}) {
  if (from || to) {
    return Analytics.aggregate([
      { $match: { eventType: 'image_view', targetType: 'image', ...rangeMatch(from, to) } },
      { $group: { _id: '$targetId', eventViews: { $sum: 1 } } },
      { $sort: { eventViews: -1 } },
      { $limit: limit },
      { $lookup: { from: 'images', localField: '_id', foreignField: '_id', as: 'image' } },
      { $unwind: '$image' },
      {
        $project: {
          _id: 0,
          id: '$image._id',
          title: '$image.title',
          slug: '$image.slug',
          thumbnailUrl: '$image.thumbnailUrl',
          views: '$image.views',
          promptCopyCount: '$image.promptCopyCount',
          eventViews: 1,
        },
      },
    ]);
  }

  return Image.find({ status: 'published' }, 'title slug thumbnailUrl views promptCopyCount')
    .sort({ views: -1, publishedAt: -1 })
    .limit(limit)
    .lean();
}

/* ----------------------------- getTopCategories ------------------------------ */

/**
 * Most-viewed categories (denormalized all-time, or event-log by range).
 * @param {object} opts { from?, to?, limit? }
 */
async function getTopCategories({ from, to, limit = 10 } = {}) {
  if (from || to) {
    return Analytics.aggregate([
      { $match: { eventType: 'category_view', targetType: 'category', ...rangeMatch(from, to) } },
      { $group: { _id: '$targetId', eventViews: { $sum: 1 } } },
      { $sort: { eventViews: -1 } },
      { $limit: limit },
      { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'category' } },
      { $unwind: '$category' },
      {
        $project: {
          _id: 0,
          id: '$category._id',
          name: '$category.name',
          slug: '$category.slug',
          views: '$category.views',
          imageCount: '$category.imageCount',
          eventViews: 1,
        },
      },
    ]);
  }

  return Category.find({}, 'name slug views imageCount')
    .sort({ views: -1 })
    .limit(limit)
    .lean();
}

/* ------------------------------ getTopSearches ------------------------------- */

/**
 * Most frequent search queries with average result counts.
 * @param {object} opts { from?, to?, limit? }
 */
async function getTopSearches({ from, to, limit = 10 } = {}) {
  return SearchLog.aggregate([
    { $match: { ...rangeMatch(from, to) } },
    {
      $group: {
        _id: '$query',
        count: { $sum: 1 },
        avgResults: { $avg: '$resultsCount' },
      },
    },
    { $sort: { count: -1 } },
    { $limit: limit },
    {
      $project: {
        _id: 0,
        query: '$_id',
        count: 1,
        avgResults: { $round: ['$avgResults', 0] },
      },
    },
  ]);
}

module.exports = {
  recordEvent,
  getSummary,
  getTopImages,
  getTopCategories,
  getTopSearches,
};
