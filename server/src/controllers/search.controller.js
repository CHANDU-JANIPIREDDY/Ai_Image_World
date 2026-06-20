'use strict';

/**
 * controllers/search.controller.js — Search endpoint handlers (thin).
 *
 * search      : text search results + pagination meta (incl. echoed query).
 * suggestions : autocomplete buckets.
 * recordClick : log a result click-through.
 */

const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const searchService = require('../services/search.service');

/** GET /search  (Public) */
const search = asyncHandler(async (req, res) => {
  const result = await searchService.searchImages(req.query);
  return ApiResponse.send(res, {
    message: 'Search results',
    data: result.images,
    meta: {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: Math.ceil(result.total / result.limit) || 0,
      query: result.query,
    },
  });
});

/** GET /search/suggestions  (Public) */
const suggestions = asyncHandler(async (req, res) => {
  const data = await searchService.searchSuggestions(req.query);
  return ApiResponse.send(res, { message: 'Suggestions', data });
});

/** POST /search/click  (Public) */
const recordClick = asyncHandler(async (req, res) => {
  await searchService.recordSearchClick(req.body);
  return ApiResponse.send(res, { message: 'Click recorded' });
});

module.exports = { search, suggestions, recordClick };
