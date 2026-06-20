'use strict';

/**
 * utils/asyncHandler.js — Async route-handler wrapper.
 *
 * Wraps an async controller so any thrown error or rejected promise is
 * forwarded to next() → the central errorHandler. Removes per-handler
 * try/catch boilerplate.
 *
 * Usage: router.get('/', asyncHandler(async (req, res) => { ... }));
 */

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;
