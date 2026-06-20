'use strict';

/**
 * middleware/auth.middleware.js — Route guards.
 *
 * verifyJWT      : validates the Bearer access token, attaches req.user.
 * requireRole(..): authorizes by admin role (use AFTER verifyJWT).
 *
 * JWT verification errors propagate to the central errorHandler, which maps
 * them to 401 UNAUTHORIZED / TOKEN_EXPIRED (API Spec §1.2).
 */

const ApiError = require('../utils/ApiError');
const authService = require('../services/auth.service');

/**
 * Verify the access token from the Authorization header and attach the
 * authenticated principal to req.user = { id, role }.
 */
function verifyJWT(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');

    if (scheme !== 'Bearer' || !token) {
      throw ApiError.unauthorized('Authentication required', 'UNAUTHORIZED');
    }

    const decoded = authService.verifyAccessToken(token); // throws on invalid/expired

    if (decoded.type !== 'access') {
      throw ApiError.unauthorized('Invalid token type', 'UNAUTHORIZED');
    }

    req.user = { id: decoded.sub, role: decoded.role };
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Optional authentication: if a valid Bearer access token is present, attach
 * req.user; otherwise continue anonymously. Used on public endpoints that
 * reveal extra data to admins (e.g. non-published images). Never rejects.
 */
function optionalAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');
    if (scheme === 'Bearer' && token) {
      const decoded = authService.verifyAccessToken(token);
      if (decoded.type === 'access') {
        req.user = { id: decoded.sub, role: decoded.role };
      }
    }
  } catch (_err) {
    // Invalid/expired token on an optional route → treat as anonymous.
  }
  next();
}

/**
 * Restrict a route to one or more roles. Must run after verifyJWT.
 * @param {...string} roles  Allowed roles (e.g. 'superadmin', 'admin')
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required', 'UNAUTHORIZED'));
    }
    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden('Insufficient permissions', 'FORBIDDEN'));
    }
    next();
  };
}

module.exports = { verifyJWT, optionalAuth, requireRole };
