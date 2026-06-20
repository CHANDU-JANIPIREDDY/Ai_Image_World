'use strict';

/**
 * src/seed/seed.js — One-shot full seed: superadmin + demo content.
 *
 * Delegates to seedContent.run() (which itself ensures the superadmin first),
 * so `npm run seed` bootstraps an empty database with everything needed to
 * explore the app and admin dashboard.
 */

const { run } = require('./seedContent');

if (require.main === module) {
  run()
    .then(() => process.exit(0))
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.error('❌ Seed failed:', err);
      process.exit(1);
    });
}
