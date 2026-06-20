'use strict';

/**
 * middleware/rateLimiter.js — Request throttling (API Spec §8.1).
 *
 * Exposes a `createRateLimiter` factory plus pre-configured named limiters:
 *   - globalLimiter : 100 req / min        (all public traffic)
 *   - loginLimiter  : 5 req / 15 min       (brute-force protection on login)
 *   - searchLimiter : 30 req / min         (search abuse)
 *   - actionLimiter : 60 req / min         (view/copy/analytics events)
 *
 * Every limiter responds with the standard 429 envelope and a Retry-After
 * header. In test mode limits are disabled so suites aren't throttled.
 */

const rateLimit = require('express-rate-limit');
const env = require('../config/env');

/**
 * Build a rate limiter with the standard envelope response.
 * @param {object} opts
 * @param {number} opts.windowMs  Window size in ms
 * @param {number} opts.max       Max requests per window per IP
 * @param {string} [opts.message] Human-readable message
 */
function createRateLimiter({ windowMs, max, message }) {
  return rateLimit({
    windowMs,
    max: env.isTest ? 0 : max, // 0 = unlimited; disable throttling in tests
    standardHeaders: true, // RateLimit-* headers
    legacyHeaders: false,
    handler: (req, res) => {
      const retryAfterSec = Math.ceil(windowMs / 1000);
      res.set('Retry-After', String(retryAfterSec));
      res.status(429).json({
        success: false,
        message: message || 'Too many requests, please try again later.',
        code: 'RATE_LIMITED',
      });
    },
  });
}

const globalLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 100,
  message: 'Too many requests, please try again later.',
});

const loginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts. Please try again in 15 minutes.',
});

const searchLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 30,
  message: 'Too many searches, please slow down.',
});

const actionLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 60,
  message: 'Too many requests, please slow down.',
});

module.exports = {
  createRateLimiter,
  globalLimiter,
  loginLimiter,
  searchLimiter,
  actionLimiter,
};
