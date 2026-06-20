'use strict';

/**
 * routes/auth.routes.js — Authentication routes (API Spec §2).
 *
 *   POST   /auth/login            Public   (loginLimiter + validation)
 *   GET    /auth/me               Admin
 *   POST   /auth/refresh          Public   (refresh cookie)
 *   POST   /auth/logout           Admin
 *   PUT    /auth/change-password  Admin    (validation)
 */

const express = require('express');

const authController = require('../controllers/auth.controller');
const { verifyJWT } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const { loginLimiter } = require('../middleware/rateLimiter');
const { loginSchema, changePasswordSchema } = require('../validators/auth.validator');

const router = express.Router();

router.post('/login', loginLimiter, validate(loginSchema), authController.login);
router.get('/me', verifyJWT, authController.me);
router.post('/refresh', authController.refresh);
router.post('/logout', verifyJWT, authController.logout);
router.put(
  '/change-password',
  verifyJWT,
  validate(changePasswordSchema),
  authController.changePassword
);

module.exports = router;
