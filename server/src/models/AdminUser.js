'use strict';

/**
 * models/AdminUser.js — Authenticated admin/dashboard users.
 *
 * Stores only the password HASH (select:false so it never leaks). Hashing is
 * performed in auth.service before save; this model exposes comparePassword()
 * and lockout helpers used by the authentication flow (API Spec §2.1).
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const { Schema } = mongoose;

const adminUserSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
    },

    // bcrypt/argon2 hash only — never plaintext. Excluded from query results.
    passwordHash: { type: String, required: true, select: false },

    role: {
      type: String,
      enum: ['superadmin', 'admin', 'editor'],
      default: 'admin',
    },

    status: {
      type: String,
      enum: ['active', 'suspended'],
      default: 'active',
    },

    lastLoginAt: { type: Date },

    // Brute-force protection (API Spec §2.1 ACCOUNT_LOCKED).
    failedLoginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        delete ret.passwordHash; // defense-in-depth: never serialize the hash
        return ret;
      },
    },
  }
);

// Compound index for admin-management filtering (DB Design §4.3).
adminUserSchema.index({ role: 1, status: 1 });

// True while a temporary lockout window is active.
adminUserSchema.virtual('isLocked').get(function isLocked() {
  return Boolean(this.lockUntil && this.lockUntil > Date.now());
});

/**
 * Compare a plaintext candidate against the stored hash.
 * Requires the document to be loaded WITH the passwordHash field
 * (e.g. `AdminUser.findOne({ email }).select('+passwordHash')`).
 * @param {string} candidate
 * @returns {Promise<boolean>}
 */
adminUserSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.passwordHash);
};

module.exports = mongoose.model('AdminUser', adminUserSchema);
