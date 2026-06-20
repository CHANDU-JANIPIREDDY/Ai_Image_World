'use strict';

/**
 * src/seed/seedSuperAdmin.js — Initial superadmin bootstrap (Roadmap task 2.7).
 *
 * Idempotent: connects to MongoDB, skips if a superadmin already exists,
 * otherwise creates one with a hashed password (via auth.service.hashPassword).
 * Safe to run repeatedly, including in CI/deploy pipelines.
 *
 * Run with:  npm run seed:admin
 *
 * Credentials are read from env (so production can inject a strong password)
 * and fall back to the documented defaults for local development.
 */

const env = require('../config/env');
const { connectDB, disconnectDB } = require('../config/db');
const { hashPassword } = require('../services/auth.service');
const { AdminUser } = require('../models');

// Defaults — overridable via environment variables.
const DEFAULTS = {
  name: process.env.SEED_ADMIN_NAME || 'Super Admin',
  email: (process.env.SEED_ADMIN_EMAIL || 'admin@aiimageworld.com').toLowerCase().trim(),
  password: process.env.SEED_ADMIN_PASSWORD || 'Admin@12345',
};

const DEFAULT_PASSWORD = 'Admin@12345';

/**
 * Core seeding logic — assumes a DB connection already exists. Reusable by the
 * CLI runner below and by the server on startup (in-memory dev mode).
 */
async function ensureSuperAdmin() {
  // Skip if any superadmin already exists (idempotency).
  const existing = await AdminUser.findOne({ role: 'superadmin' });
  if (existing) {
    // eslint-disable-next-line no-console
    console.log(`ℹ️  Superadmin already exists (${existing.email}) — skipping creation.`);
    return;
  }

  // Guard: don't accidentally collide with an existing non-superadmin email.
  const emailTaken = await AdminUser.findOne({ email: DEFAULTS.email });
  if (emailTaken) {
    throw new Error(
      `Cannot seed: email "${DEFAULTS.email}" is already in use by a non-superadmin account.`
    );
  }

  // Refuse the default password in production — force an explicit strong one.
  if (env.isProd && DEFAULTS.password === DEFAULT_PASSWORD) {
    throw new Error(
      'Refusing to seed the default password in production. ' +
        'Set SEED_ADMIN_PASSWORD to a strong value and re-run.'
    );
  }

  const passwordHash = await hashPassword(DEFAULTS.password);

  await AdminUser.create({
    name: DEFAULTS.name,
    email: DEFAULTS.email,
    passwordHash,
    role: 'superadmin',
    status: 'active',
  });

  // eslint-disable-next-line no-console
  console.log(`✅ Superadmin created: ${DEFAULTS.email}`);

  if (DEFAULTS.password === DEFAULT_PASSWORD) {
    // eslint-disable-next-line no-console
    console.warn(
      '⚠️  Default password in use (Admin@12345). Change it immediately via ' +
        'PUT /api/v1/auth/change-password.'
    );
  }
}

// CLI runner: connect, seed, disconnect. Only runs when invoked directly
// (e.g. `npm run seed:admin`), not when imported by the server.
async function runCli() {
  await connectDB();
  await ensureSuperAdmin();
}

if (require.main === module) {
  runCli()
    .then(async () => {
      await disconnectDB();
      process.exit(0);
    })
    .catch(async (err) => {
      // eslint-disable-next-line no-console
      console.error('❌ Seed failed:', err.message);
      await disconnectDB();
      process.exit(1);
    });
}

module.exports = { ensureSuperAdmin };
