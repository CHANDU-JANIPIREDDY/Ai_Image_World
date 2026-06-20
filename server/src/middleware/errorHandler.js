'use strict';

/**
 * middleware/errorHandler.js — Centralized error funnel (final middleware).
 *
 * Translates known error shapes into the standard API envelope:
 *   { success:false, message, code, errors? }
 *
 * Handles: ApiError, Mongoose CastError / ValidationError / duplicate-key,
 * JWT errors, and zod errors. Unknown errors become a generic 500 with the
 * stack logged server-side (and exposed only outside production).
 */

const env = require('../config/env');
const ApiError = require('../utils/ApiError');

/**
 * Normalize any thrown value into a consistent shape.
 * @returns {{ statusCode:number, code:string, message:string, errors?:Array }}
 */
function normalizeError(err) {
  // 1) Our own operational errors — pass through.
  if (err instanceof ApiError) {
    return {
      statusCode: err.statusCode,
      code: err.code,
      message: err.message,
      errors: err.errors,
    };
  }

  // 2) Mongoose: invalid ObjectId / cast failure.
  if (err.name === 'CastError') {
    return {
      statusCode: 400,
      code: 'BAD_REQUEST',
      message: `Invalid value for '${err.path}'`,
    };
  }

  // 3) Mongoose: schema validation failure → 422 with field details.
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return {
      statusCode: 422,
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      errors,
    };
  }

  // 4) Mongoose: duplicate key (unique index violation) → 409.
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return {
      statusCode: 409,
      code: 'DUPLICATE_RESOURCE',
      message: `Duplicate value for '${field}'`,
      errors: [{ field, message: 'Already exists' }],
    };
  }

  // 5) JWT errors → 401.
  if (err.name === 'JsonWebTokenError') {
    return { statusCode: 401, code: 'UNAUTHORIZED', message: 'Invalid token' };
  }
  if (err.name === 'TokenExpiredError') {
    return { statusCode: 401, code: 'TOKEN_EXPIRED', message: 'Token expired' };
  }

  // 6) zod validation errors → 422 with field details.
  if (err.name === 'ZodError' && Array.isArray(err.issues)) {
    const errors = err.issues.map((i) => ({
      field: i.path.join('.'),
      message: i.message,
    }));
    return {
      statusCode: 422,
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      errors,
    };
  }

  // 7) Fallback — unexpected/programmer error.
  return {
    statusCode: err.statusCode || 500,
    code: err.code || 'INTERNAL_ERROR',
    message: err.message || 'Internal server error',
  };
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const { statusCode, code, message, errors } = normalizeError(err);

  // Log server-side. 5xx are unexpected → log full stack; 4xx are expected.
  if (statusCode >= 500) {
    // eslint-disable-next-line no-console
    console.error(`[ERROR] ${req.method} ${req.originalUrl}`, err);
  } else if (!env.isProd) {
    // eslint-disable-next-line no-console
    console.warn(`[WARN] ${req.method} ${req.originalUrl} → ${statusCode} ${code}: ${message}`);
  }

  res.status(statusCode).json({
    success: false,
    message,
    code,
    ...(errors ? { errors } : {}),
    ...(env.isProd ? {} : { stack: err.stack }),
  });
}

module.exports = errorHandler;
