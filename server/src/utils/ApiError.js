'use strict';

/**
 * utils/ApiError.js — Operational (expected) error type.
 *
 * Throw this anywhere to produce a controlled API response, e.g.:
 *   throw new ApiError(404, 'Image not found', 'NOT_FOUND');
 *
 * The error handler recognizes ApiError and renders the standard envelope.
 * `isOperational` distinguishes these from unexpected programmer errors.
 */

class ApiError extends Error {
  /**
   * @param {number} statusCode  HTTP status code
   * @param {string} message     Human-readable message
   * @param {string} [code]      Machine-readable error code (API Spec §1.3)
   * @param {Array<{field:string,message:string}>} [errors]  Field-level details
   */
  constructor(statusCode, message, code = 'INTERNAL_ERROR', errors = null) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    if (errors) this.errors = errors;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }

  // Convenience factories for the common cases (API Spec §1.2/§1.3).
  static badRequest(msg = 'Bad request', code = 'BAD_REQUEST', errors) {
    return new ApiError(400, msg, code, errors);
  }
  static unauthorized(msg = 'Unauthorized', code = 'UNAUTHORIZED') {
    return new ApiError(401, msg, code);
  }
  static forbidden(msg = 'Forbidden', code = 'FORBIDDEN') {
    return new ApiError(403, msg, code);
  }
  static notFound(msg = 'Resource not found', code = 'NOT_FOUND') {
    return new ApiError(404, msg, code);
  }
  static conflict(msg = 'Resource already exists', code = 'DUPLICATE_RESOURCE') {
    return new ApiError(409, msg, code);
  }
  static validation(msg = 'Validation failed', errors) {
    return new ApiError(422, msg, 'VALIDATION_ERROR', errors);
  }
}

module.exports = ApiError;
