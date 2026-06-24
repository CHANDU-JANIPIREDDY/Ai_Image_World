'use strict';

/**
 * server.js — Process entry point.
 *
 * The only file that touches the outside world: validates env, connects to
 * MongoDB BEFORE accepting traffic (fail-fast), starts the HTTP listener, and
 * handles graceful shutdown + crash safety.
 *
 * Env validation lives in config/env.js; the Mongo connection in config/db.js.
 * (The DNS resolver override needed for Atlas SRV lookups lives in config/db.js,
 * before mongoose is required.)
 */

const env = require('./config/env');
const { connectDB, disconnectDB, isMemoryActive } = require('./config/db');
const app = require('./app');

let server;

/**
 * Connect to MongoDB, then start the HTTP server.
 * Exits the process if the database connection fails on startup.
 */
async function start() {
  try {
    await connectDB();

    // In-memory dev DB (flag or fallback) is per-process and empty on boot —
    // seed the superadmin so login works immediately.
    if (isMemoryActive()) {
      // eslint-disable-next-line global-require
      const { ensureSuperAdmin } = require('./seed/seedSuperAdmin');
      await ensureSuperAdmin();
    }

    server = app.listen(env.PORT, () => {
      // eslint-disable-next-line no-console
      console.log(
        `🚀 AI Image World API running on port ${env.PORT} [${env.NODE_ENV}]`
      );
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('❌ Failed to start server:', err.message);
    process.exit(1);
  }
}

/**
 * Gracefully close the HTTP server and DB connection, then exit.
 */
async function shutdown(signal) {
  // eslint-disable-next-line no-console
  console.log(`\n${signal} received — shutting down gracefully...`);
  try {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
      // eslint-disable-next-line no-console
      console.log('🛑 HTTP server closed');
    }
    await disconnectDB();
    // eslint-disable-next-line no-console
    console.log('🛑 MongoDB connection closed');
    process.exit(0);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error during shutdown:', err.message);
    process.exit(1);
  }
}

// OS / orchestrator termination signals (used by deploy platforms in Phase 10).
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Last-resort safety nets for unexpected failures.
process.on('unhandledRejection', (reason) => {
  // eslint-disable-next-line no-console
  console.error('Unhandled Promise Rejection:', reason);
  shutdown('unhandledRejection');
});
process.on('uncaughtException', (err) => {
  // eslint-disable-next-line no-console
  console.error('Uncaught Exception:', err);
  shutdown('uncaughtException');
});

start();
