'use strict';

/**
 * middleware/notFound.js — 404 handler.
 *
 * Mounted after all routes. Any unmatched request is converted into a
 * NOT_FOUND ApiError and forwarded to the centralized error handler, so 404s
 * use the same response envelope as every other error.
 */

const ApiError = require('../utils/ApiError');

function notFound(req, res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

module.exports = notFound;
