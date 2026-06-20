'use strict';

/**
 * controllers/auth.controller.js — Auth endpoint handlers (thin).
 *
 * Each handler validates-ready input → calls auth.service → replies via
 * ApiResponse. The refresh token is carried in an httpOnly cookie; only the
 * access token is returned in the JSON body (API Spec §2).
 */

const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const authService = require('../services/auth.service');
const { AdminUser } = require('../models');

const REFRESH_COOKIE = 'refreshToken';

/**
 * POST /auth/login  (Public)
 * Authenticate and issue tokens. Sets refresh cookie; returns access token + user.
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const { accessToken, refreshToken, user } = await authService.login(email, password);

  res.cookie(REFRESH_COOKIE, refreshToken, authService.refreshCookieOptions());

  return ApiResponse.send(res, {
    statusCode: 200,
    message: 'Login successful',
    data: { accessToken, user },
  });
});

/**
 * GET /auth/me  (Admin)
 * Return the authenticated admin's profile.
 */
const me = asyncHandler(async (req, res) => {
  const user = await AdminUser.findById(req.user.id);
  if (!user) throw ApiError.notFound('User not found', 'NOT_FOUND');

  return ApiResponse.send(res, {
    message: 'Current user',
    data: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      lastLoginAt: user.lastLoginAt,
    },
  });
});

/**
 * POST /auth/refresh  (Public + refresh cookie)
 * Rotate tokens: verify refresh cookie, issue new access (and refresh) token.
 */
const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE];
  const { accessToken, refreshToken } = await authService.refresh(token);

  res.cookie(REFRESH_COOKIE, refreshToken, authService.refreshCookieOptions());

  return ApiResponse.send(res, {
    message: 'Token refreshed',
    data: { accessToken },
  });
});

/**
 * POST /auth/logout  (Admin)
 * Clear the refresh cookie. (Stateless JWT: no server-side store to revoke.)
 */
const logout = asyncHandler(async (req, res) => {
  res.clearCookie(REFRESH_COOKIE, { path: '/api/v1/auth' });
  return ApiResponse.send(res, { message: 'Logged out' });
});

/**
 * PUT /auth/change-password  (Admin)
 * Verify current password and set a new one.
 */
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  await authService.changePassword(req.user.id, currentPassword, newPassword);
  return ApiResponse.send(res, { message: 'Password updated' });
});

module.exports = { login, me, refresh, logout, changePassword };
