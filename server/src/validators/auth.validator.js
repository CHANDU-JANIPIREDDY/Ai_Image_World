'use strict';

/**
 * validators/auth.validator.js — Request schemas for auth endpoints.
 *
 * These zod schemas validate req.body BEFORE controller logic runs (via the
 * validate middleware added later). Each is shaped as `{ body: <schema> }` so a
 * generic validator can target body/query/params uniformly.
 *
 * Password policy (API Spec §2.5): 8–72 chars, ≥1 uppercase, ≥1 number,
 * and newPassword must differ from currentPassword.
 */

const { z } = require('zod');

// Reusable password rule for new/changed passwords.
const strongPassword = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password must be at most 72 characters')
  .regex(/[A-Z]/, 'Password must contain an uppercase letter')
  .regex(/[0-9]/, 'Password must contain a number');

const loginSchema = {
  body: z.object({
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Invalid email format')
      .transform((v) => v.toLowerCase().trim()),
    // Login does not enforce complexity (that's done at creation); just bounds.
    password: z.string().min(1, 'Password is required').max(72),
  }),
};

const changePasswordSchema = {
  body: z
    .object({
      currentPassword: z.string().min(1, 'Current password is required'),
      newPassword: strongPassword,
    })
    .refine((data) => data.newPassword !== data.currentPassword, {
      message: 'New password must be different from the current password',
      path: ['newPassword'],
    }),
};

module.exports = { loginSchema, changePasswordSchema, strongPassword };
