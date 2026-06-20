'use strict';

/**
 * services/auth.service.js — Authentication business logic + token utilities.
 *
 * Owns password hashing, JWT issue/verify (separate access & refresh secrets),
 * login with brute-force lockout, and refresh-token rotation. Controllers call
 * into this layer and stay thin.
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const env = require('../config/env');
const ApiError = require('../utils/ApiError');
const { AdminUser } = require('../models');

const SALT_ROUNDS = 12;
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_TIME_MS = 15 * 60 * 1000; // 15 minutes

/* ------------------------------ Password hashing ----------------------------- */

/**
 * Hash a plaintext password.
 * @param {string} plain
 * @returns {Promise<string>}
 */
async function hashPassword(plain) {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

/* -------------------------------- Token utils -------------------------------- */

/**
 * Sign a short-lived access token.
 * @param {{ id: string, role: string }} payload
 * @returns {string}
 */
function generateAccessToken({ id, role }) {
  return jwt.sign({ sub: String(id), role, type: 'access' }, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRY,
  });
}

/**
 * Sign a long-lived refresh token.
 * @param {{ id: string, role: string }} payload
 * @returns {string}
 */
function generateRefreshToken({ id, role }) {
  return jwt.sign({ sub: String(id), role, type: 'refresh' }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRY,
  });
}

/**
 * Verify an access token. Throws JsonWebTokenError/TokenExpiredError on failure
 * (mapped to 401 by the central error handler).
 * @param {string} token
 * @returns {{ sub: string, role: string, type: string }}
 */
function verifyAccessToken(token) {
  return jwt.verify(token, env.JWT_ACCESS_SECRET);
}

/**
 * Verify a refresh token.
 * @param {string} token
 * @returns {{ sub: string, role: string, type: string }}
 */
function verifyRefreshToken(token) {
  return jwt.verify(token, env.JWT_REFRESH_SECRET);
}

/**
 * Issue both tokens for a user document.
 * @param {object} user
 */
function issueTokens(user) {
  const payload = { id: user._id, role: user.role };
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
}

/**
 * Cookie options for the httpOnly refresh-token cookie (used by routes).
 * @returns {object}
 */
function refreshCookieOptions() {
  return {
    httpOnly: true,
    secure: env.isProd,
    sameSite: env.isProd ? 'none' : 'lax',
    path: '/api/v1/auth',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  };
}

/* ----------------------------------- Login ----------------------------------- */

/**
 * Authenticate an admin and issue tokens.
 * Implements brute-force lockout and a generic failure message so we never
 * reveal whether an email exists (API Spec §2.1).
 *
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ accessToken: string, refreshToken: string, user: object }>}
 */
async function login(email, password) {
  const genericInvalid = ApiError.unauthorized('Invalid email or password', 'UNAUTHORIZED');

  // Must explicitly select the hash (it is select:false on the schema).
  const user = await AdminUser.findOne({ email }).select('+passwordHash');
  if (!user) throw genericInvalid;

  // Temporary lockout window active?
  if (user.isLocked) {
    throw new ApiError(
      423,
      'Account temporarily locked due to failed login attempts. Try again later.',
      'ACCOUNT_LOCKED'
    );
  }

  if (user.status === 'suspended') {
    throw ApiError.forbidden('Account suspended', 'FORBIDDEN');
  }

  const match = await user.comparePassword(password);
  if (!match) {
    user.failedLoginAttempts += 1;
    if (user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
      user.lockUntil = new Date(Date.now() + LOCK_TIME_MS);
      user.failedLoginAttempts = 0; // reset counter; lock window now governs
    }
    await user.save();
    throw genericInvalid;
  }

  // Success — reset counters and stamp last login.
  user.failedLoginAttempts = 0;
  user.lockUntil = undefined;
  user.lastLoginAt = new Date();
  await user.save();

  const tokens = issueTokens(user);
  return {
    ...tokens,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
}

/* ---------------------------------- Refresh ---------------------------------- */

/**
 * Exchange a valid refresh token for a new access token (and rotate refresh).
 * @param {string} token  Refresh token from the httpOnly cookie
 * @returns {Promise<{ accessToken: string, refreshToken: string }>}
 */
async function refresh(token) {
  if (!token) throw ApiError.unauthorized('Missing refresh token', 'UNAUTHORIZED');

  const decoded = verifyRefreshToken(token); // throws → 401 via error handler
  if (decoded.type !== 'refresh') {
    throw ApiError.unauthorized('Invalid token type', 'UNAUTHORIZED');
  }

  const user = await AdminUser.findById(decoded.sub);
  if (!user || user.status === 'suspended') {
    throw ApiError.unauthorized('Invalid refresh token', 'UNAUTHORIZED');
  }

  return issueTokens(user); // rotation: new refresh token issued too
}

/* ----------------------------- Change password ------------------------------- */

/**
 * Change an admin's password after verifying the current one.
 * @param {string} userId
 * @param {string} currentPassword
 * @param {string} newPassword
 * @returns {Promise<void>}
 */
async function changePassword(userId, currentPassword, newPassword) {
  const user = await AdminUser.findById(userId).select('+passwordHash');
  if (!user) throw ApiError.notFound('User not found', 'NOT_FOUND');

  const match = await user.comparePassword(currentPassword);
  if (!match) throw ApiError.unauthorized('Current password is incorrect', 'UNAUTHORIZED');

  user.passwordHash = await hashPassword(newPassword);
  await user.save();
}

module.exports = {
  hashPassword,
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  issueTokens,
  refreshCookieOptions,
  login,
  refresh,
  changePassword,
};
